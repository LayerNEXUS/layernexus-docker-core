from itertools import combinations
import pandas as pd

def suggest_composite_key(df: pd.DataFrame, max_columns: int = 3) -> list:
    """
    Suggests the smallest composite key (1 to `max_columns` columns) that uniquely identifies rows.
    Prioritizes smaller keys and earlier column combinations.
    
    Args:
        df: Input DataFrame
        max_columns: Maximum number of columns to consider in composite keys
    
    Returns:
        List of column names forming the composite key, or empty list if none found
    """
    if df.empty:
        return []

    # Check up to the smaller of max_columns or total columns
    max_possible = min(max_columns, len(df.columns))
    
    for r in range(1, max_possible + 1):
        for cols in combinations(df.columns, r):
            # Fast check: Skip if any nulls in key columns (unless all values are null)
            if df[list(cols)].isnull().any().any() and not df[list(cols)].isnull().all().all():
                continue
                
            # Efficient uniqueness check
            if not df.duplicated(subset=cols).any():
                return list(cols)
    
    return []