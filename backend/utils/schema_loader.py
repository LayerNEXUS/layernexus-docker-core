import json
from pathlib import Path
from typing import Dict
from backend.models.schema_models import TableProfile, ColumnProfile

def load_schema(session_id: str) -> Dict[str, TableProfile]:
    """Load schema from session directory"""
    schema_path = Path(f"uploads/{session_id}/schema.json")
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema not found for session: {session_id}")
    
    with open(schema_path, 'r') as f:
        raw_schema = json.load(f)
        raw_schema.pop("_version", None)
    
    return {
        table_name: TableProfile(
            name=table_name,
            columns={
                col_name: ColumnProfile(
                    name=col_name,
                    detected_type=col_meta['detected_type'],
                    unique_ratio=col_meta['unique_ratio'],
                    null_percent=col_meta['null_percent'],
                    sample_values=col_meta.get('sample_values', []),
                    is_primary_key=col_meta.get('is_primary_key', False),
                    is_foreign_key_to=col_meta.get('is_foreign_key_to'),
                    semantic_type=col_meta.get('semantic_type'),
                    llm_column_description=col_meta.get('llm_column_description'),
                    original_column_name=col_meta.get('original_column_name')
                )
                for col_name, col_meta in table_data['columns'].items()
            },
            file_path=table_data['file_path']
        )
        for table_name, table_data in raw_schema.items()
    }

def save_schema(session_id: str, schema: Dict[str, TableProfile], rejected_files: Dict[str, str] = None):
    """Persist schema and rejected file reasons to disk"""
    session_dir = Path(f"uploads/{session_id}")
    schema_path = session_dir / "schema.json"
    session_dir.mkdir(parents=True, exist_ok=True)

    # Save schema.json
    with open(schema_path, 'w') as f:
        json.dump({
            "_version": "1.0",
            **{
                table_name: {
                    'columns': {
                        col_name: {
                            'detected_type': col.detected_type,
                            'unique_ratio': col.unique_ratio,
                            'null_percent': col.null_percent,
                            'is_primary_key': col.is_primary_key,
                            'is_foreign_key_to': col.is_foreign_key_to,
                            'semantic_type': col.semantic_type,
                            'llm_column_description': col.llm_column_description,
                            'original_column_name': col.original_column_name
                        }
                        for col_name, col in table.columns.items()
                    },
                    'file_path': table.file_path
                }
                for table_name, table in schema.items()
            }
        }, f, indent=2)

    # Save rejected_files.json if provided
    if rejected_files:
        rejected_path = session_dir / "rejected_files.json"
        with open(rejected_path, 'w') as rf:
            json.dump(rejected_files, rf, indent=2)