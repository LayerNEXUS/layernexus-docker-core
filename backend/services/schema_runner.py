import uuid
import os
import pandas as pd
from typing import List
import csv
import re
from backend.services.key_suggestion import KeyPrioritizer
from backend.services.fuzzy_matching import FuzzyEntityMatcher
from backend.services.entity_grouper import group_columns_by_fuzzy_match, suggest_canonical_names
from backend.services.sql_generator import SQLGenerator
from backend.models.schema_models import TableProfile, ColumnProfile
from backend.services.type_inference import infer_column_type
from backend.utils.data_loader import clean_dataframe
from backend.utils.file_handler import detect_encoding, check_file_validity
from backend.services.llm_schema_reviewer import review_schema_with_llm
from backend.services.sql_generator import generate_mermaid
from backend.services.decomposer import decompose_flat_file_3nf
from backend.utils.json_csv import json_to_clean_csv
from backend.services.composite_key_detector import suggest_composite_key
from backend.utils.table_overlap_detector import detect_overlapping_tables
from backend.models.schema_models import SchemaHistory
from datetime import datetime



def sanitize_table_name(filename: str) -> str:
    base = os.path.splitext(filename)[0]
    return re.sub(r'\W|^(?=\d)', '_', base.lower())


def run_schema_inference(file_paths: List[str], username: str, use_llm: bool = False, db=None) -> dict:
    session_id = str(uuid.uuid4())

    schema = {}
    data_samples = {}
    rejected_files = {}

    for path in file_paths:
        filename = os.path.basename(path)
        ext = os.path.splitext(filename)[-1].lower()
        df = None

        try:
            check_file_validity(filename, os.path.getsize(path) / (1024 * 1024))  # MB

            if ext == ".json":
                df = json_to_clean_csv(path)
            elif ext == ".csv":
                with open(path, "rb") as f:
                    encoding = detect_encoding(f)
                df = pd.read_csv(
                    path,
                    encoding=encoding,
                    delimiter=None,
                    skipinitialspace=True,
                    on_bad_lines='error',
                    quoting=csv.QUOTE_MINIMAL,
                    dtype=str,
                    engine='python',
                    keep_default_na=False
                )
            else:
                rejected_files[filename] = "Unsupported file format"
                continue
        except Exception as e:
            rejected_files[filename] = f"File read error: {str(e)}"
            continue

        try:
            df = clean_dataframe(df)
            if df.empty:
                rejected_files[filename] = "No data after cleaning"
                continue
        except Exception as e:
            rejected_files[filename] = f"Cleaning error: {str(e)}"
            continue

        table_key = sanitize_table_name(filename)
        file_path = path

        columns = {}
        for col in df.columns:
            name_clean = col.strip().lower()
            if not name_clean or name_clean == "index" or re.fullmatch(r"unnamed:\s*\d+", name_clean):
                continue
            if df[col].isnull().all():
                continue
            if df[col].nunique(dropna=True) <= 1:
                continue
            if re.fullmatch(r"(col|column)[_\s-]?\d+", name_clean):
                continue

            col_series = df[col]
            col_data = col_series.dropna()
            null_percent = col_series.isnull().mean()
            is_nullable = (null_percent > 0.01)
            sample_values = col_data.sample(min(5, len(col_data)), random_state=42).astype(str).tolist()

            columns[col] = {
                "type": infer_column_type(sample_values),
                "nullable": is_nullable,
                "unique_ratio": col_data.nunique() / len(col_data) if len(col_data) else 0.0,
                "sample_values": sample_values
            }

        schema[table_key] = {
            "columns": columns,
            "file_path": file_path
        }

        data_samples[table_key] = {
            col: df[col] for col in df.columns
        }

    validated_schema = {}
    for table_name, table_data in schema.items():
        validated_schema[table_name] = TableProfile(
            name=table_name,
            file_path=table_data['file_path'],
            columns={
                col_name: ColumnProfile(
                    name=col_name,
                    detected_type=col_meta.get('type', 'TEXT'),
                    unique_ratio=col_meta.get('unique_ratio', 0),
                    null_percent=1.0 if col_meta.get('nullable', True) else 0.0,
                    sample_values=col_meta.get('sample_values', []),
                )
                for col_name, col_meta in table_data['columns'].items()
            }
        )

    composite_pk_fallbacks = {}
    for table in validated_schema:
        table_profile = validated_schema[table]
        if not table_profile.columns:
            continue
        has_pk = any(col.is_primary_key for col in table_profile.columns.values())
        if not has_pk:
            df_for_pk = pd.DataFrame({k: v.tolist() for k, v in data_samples[table].items()})
            suggested = suggest_composite_key(df_for_pk)
            if suggested:
                composite_pk_fallbacks[table] = {
                    "columns": suggested,
                    "reason": "No primary key detected. These columns together uniquely identify rows."
                }

    warnings = []
    overlaps = detect_overlapping_tables(validated_schema)

    kp = KeyPrioritizer()
    relationships = kp.suggest_relationships(validated_schema)
    pk_dict = {
        table: [{"column": pk.name, "selected": True}]
        for table, pk in kp._find_primary_key_candidates(validated_schema).items()
        if pk is not None
    }

    fk_list = []
    for r in relationships:
        if r.target_table not in validated_schema:
            warnings.append(
                f"⚠️ {r.source_table}.{r.source_column} appears to reference {r.target_table}.{r.target_column}, but no such table was uploaded."
            )
            continue
        fk_list.append({
            "source_table": r.source_table,
            "source_column": r.source_column,
            "target_table": r.target_table,
            "target_column": r.target_column
        })

    matcher = FuzzyEntityMatcher()
    matches = matcher.find_matches_across_tables(validated_schema, data_samples)
    groups = group_columns_by_fuzzy_match(matches, threshold=0.75)

    if not groups:
        from collections import defaultdict
        token_groups = defaultdict(set)
        for table_name, table_prof in validated_schema.items():
            for col in table_prof.columns:
                token = col.split("_")[0].lower()
                token_groups[token].add(f"{table_name}.{col}")
        groups = [cols for cols in token_groups.values() if len(cols) >= 2]

    canonical_groups = suggest_canonical_names(groups)

    if len(validated_schema) == 1:
        original_table = list(validated_schema.values())[0]
        validated_schema = decompose_flat_file_3nf(original_table.name, original_table, canonical_groups)
    else:
        for group in canonical_groups:
            for col in group["columns"]:
                table, column = col.split(".")
                if table in validated_schema and column in validated_schema[table].columns:
                    validated_schema[table].columns[column].canonical_name = group["entity_name"]

    normalized_schema = {
        table: {
            col: {
                "type": col_meta.detected_type,
                "nullable": (col_meta.null_percent > 0.0),
                "canonical_name": getattr(col_meta, "canonical_name", None)
            }
            for col, col_meta in profile.columns.items()
        }
        for table, profile in validated_schema.items()
    }

    keys = {
        "primary_keys": pk_dict,
        "foreign_keys": fk_list
    }

    sql = SQLGenerator().generate_ddl(
        normalized_schema,
        keys,
        session_id,
        composite_pk_fallbacks=composite_pk_fallbacks
    )

    mermaid_text = generate_mermaid(normalized_schema, keys)

    if use_llm:
        try:
            sql = review_schema_with_llm(sql)
        except Exception as e:
            print("❌ LLM schema review failed:", str(e))

    if validated_schema or rejected_files:
        db.add(SchemaHistory(
            session_id=session_id,
            username=username,
            sql_output=sql if validated_schema else None,
            mermaid_output=mermaid_text if validated_schema else None,
            composite_pk_info=composite_pk_fallbacks if validated_schema else None,
            rejected_files=rejected_files,
            uploaded_files=[os.path.basename(p) for p in file_paths],
            created_at=datetime.utcnow()
        ))
        db.commit()

    return {
        "session_id": session_id,
        "sql": sql,
        "mermaid": mermaid_text,
        "warnings": warnings,
        "overlaps": overlaps,
        "rejected_files": rejected_files,
        "filenames": list(schema.keys()),
        "composite_pk_fallbacks": composite_pk_fallbacks
    }
