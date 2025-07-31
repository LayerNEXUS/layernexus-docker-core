import re
import math
from typing import List
from dateutil import parser

def infer_column_type(sample_values: List[str]) -> str:
    """
    Infer the best SQL data type from a list of sample values.
    """
    if not sample_values:
        return "TEXT"

    has_float = False
    has_int = True
    has_date = True
    has_bool = True

    for val in sample_values:
        val = val.strip().lower()

        # Boolean check
        if val not in {"true", "false", "yes", "no", "1", "0"}:
            has_bool = False

        # Integer check
        if not re.fullmatch(r"-?\d+", val):
            has_int = False

        # Float check
        if re.fullmatch(r"-?\d+\.\d+", val):
            has_float = True
        elif not re.fullmatch(r"-?\d+(\.\d+)?", val):
            has_float = False

        # Date check (yyyy-mm-dd or dd/mm/yyyy)
        try:
            _ = parser.parse(val, fuzzy=False)
        except Exception:
            has_date = False

    if has_bool:
        return "BOOLEAN"
    if has_int:
        return "INT"
    if has_float:
        return "FLOAT"
    if has_date:
        return "DATE"

    # Default to VARCHAR(n) if short, TEXT otherwise
    max_len = max(len(v) for v in sample_values)
    adjusted_len = max_len + 10
    rounded_len = ((adjusted_len + 9) // 10) * 10  # Always round UP to next 10

    return f"VARCHAR({rounded_len})" if rounded_len < 255 else "TEXT"
