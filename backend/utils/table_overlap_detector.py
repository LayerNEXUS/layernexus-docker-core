from typing import Dict, List, Tuple
from backend.models.schema_models import TableProfile

def detect_overlapping_tables(
    schema: Dict[str, TableProfile],
    threshold: float = 0.01
) -> List[Tuple[str, str, float]]:
    """
    Detect tables that share a high percentage of column names.

    Args:
        schema: Dict of table name -> TableProfile
        threshold: Jaccard similarity threshold (0.0 - 1.0)

    Returns:
        List of (table1, table2, similarity_score)
    """
    overlaps = []
    table_names = list(schema.keys())

    for i in range(len(table_names)):
        for j in range(i + 1, len(table_names)):
            t1, t2 = table_names[i], table_names[j]
            cols1 = set(schema[t1].columns.keys())
            cols2 = set(schema[t2].columns.keys())

            shared = cols1 & cols2
            union = cols1 | cols2
            score = len(shared) / len(union)

            if score >= threshold:
                overlaps.append((t1, t2, round(score, 2)))

    return overlaps
