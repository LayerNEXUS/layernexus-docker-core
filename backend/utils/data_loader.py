import json
import pandas as pd
from pathlib import Path
from backend.models.schema_models import TableProfile
from typing import Dict, List, Optional

def load_schema(session_id: str) -> Dict[str, TableProfile]:
    schema_path = Path(f"uploads/{session_id}/schema.json")
    if not schema_path.exists():
        raise FileNotFoundError(f"No schema found for session {session_id}")
    
    with open(schema_path) as f:
        data = json.load(f)
    
    return {
        table: TableProfile(**profile)
        for table, profile in data.items()
    }

def load_samples(session_id: str) -> Dict[str, Dict[str, pd.Series]]:
    samples = {}
    data_dir = Path(f"uploads/{session_id}")
    
    for file in data_dir.glob("*.parquet"):
        df = pd.read_parquet(file)
        table_name = file.stem
        samples[table_name] = {
            col: df[col].sample(min(1000, len(df))) 
            for col in df.columns
        }
    
    return samples

import pandas as pd
import re

def sanitize_column_name(name: str) -> str:
    """
    Sanitize a single column name:
    - Lowercase
    - Strip whitespace
    - Replace spaces/special characters with underscores
    - Remove duplicate/trailing underscores
    """
    name = name.strip().lower()
    name = re.sub(r"[^\w]", "_", name)         # Replace non-word chars with underscore
    name = re.sub(r"__+", "_", name)           # Collapse multiple underscores
    return name.strip("_")                     # Trim leading/trailing underscores

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Enhanced dataframe cleaning incorporating all stages from the combined solution"""
    # Stage 1: Remove technical debris
    df = df.loc[:, ~df.columns.str.contains('^Unnamed', case=False, na=False)]
    df = df.dropna(axis=1, how='all')

    # Stage 2: Clean column names
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r'[^\w]+', '_', regex=True)
        .str.replace(r'^_+|_+$', '', regex=True)
    )

    # Stage 3: Clean cell contents
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    df = df.replace(['', 'nan', 'NA', 'N/A', 'null'], pd.NA)
    df = df.replace(r'^\s*$', pd.NA, regex=True)

    # Stage 4: Remove empty rows/columns
    df = df.dropna(how='all').reset_index(drop=True)
    df = df.dropna(axis=1, how='all')

    # Stage 5: Remove low-value columns (safer implementation)
    cols_to_drop = []
    for col in df.columns:
        # Remove columns with >95% missing values
        if df[col].isna().mean() > 0.95:
            cols_to_drop.append(col)
            continue
            
        # # Remove constant columns (including those with multiple NA values)
        # unique_count = df[col].nunique(dropna=True)
        # if unique_count <= 1:
        #     cols_to_drop.append(col)
    
    return df.drop(columns=cols_to_drop)
