from collections import defaultdict, deque
from typing import List, Set, Dict, Optional
import re
from collections import Counter

def group_columns_by_fuzzy_match(
    matches: List[Dict],
    threshold: float = 0.85,
    merge_overlap: bool = True,
    min_group_size: int = 2
) -> List[Set[str]]:
    """
    Group columns that are semantically similar based on fuzzy match results,
    returning sets of columns like {"tableA.col1", "tableB.colX"}.

    This version:
      - Uses adjacency to connect columns with similarity >= threshold
      - Optionally merges overlapping groups
      - Allows ignoring groups below min_group_size

    Args:
        matches: List of match dicts from FuzzyEntityMatcher, e.g.:
                 [{"source_table": "A", "source_column": "col1",
                   "target_table": "B", "target_column": "colX",
                   "similarity": 0.9}, ...]
        threshold: Minimum similarity score (0.0 - 1.0) for adjacency
        merge_overlap: If True, merges groups that share any node
        min_group_size: Groups smaller than this are excluded from the final result

    Returns:
        A list of sets, each containing column identifiers like 'table.column'.
    """

    # 1) Build adjacency (undirected graph) of columns
    adjacency = defaultdict(set)
    for match in matches:
        if match["similarity"] >= threshold:
            src = f"{match['source_table']}.{match['source_column']}"
            tgt = f"{match['target_table']}.{match['target_column']}"
            adjacency[src].add(tgt)
            adjacency[tgt].add(src)

    # 2) Find connected components (DFS or BFS)
    visited = set()
    raw_groups = []

    def bfs(start):
        queue = deque([start])
        group = set()
        visited.add(start)
        while queue:
            node = queue.popleft()
            group.add(node)
            for neighbor in adjacency[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return group

    for node in adjacency:
        if node not in visited:
            component = bfs(node)
            raw_groups.append(component)

    # 3) Optionally merge overlapping groups
    #    Because BFS already merges connected nodes, raw_groups
    #    might not overlap. But if there are partially connected
    #    subgraphs, you can unify them. Usually BFS is enough.
    if merge_overlap:
        merged = True
        while merged:
            merged = False
            new_groups = []
            while raw_groups:
                g1 = raw_groups.pop()
                overlap_found = False
                for i, g2 in enumerate(new_groups):
                    if g1 & g2:  # Overlap
                        new_groups[i] = g1 | g2
                        overlap_found = True
                        merged = True
                        break
                if not overlap_found:
                    new_groups.append(g1)
            raw_groups = new_groups

    # 4) Filter out small groups if desired
    final_groups = [g for g in raw_groups if len(g) >= min_group_size]

    return final_groups


def suggest_canonical_names(
    groups: List[Set[str]],
    config: Optional[Dict] = None
) -> List[Dict]:
    """
    Suggest a canonical name for each fuzzy-matched group of columns using a flexible,
    data-driven approach.

    Args:
        groups: List of sets like {"users.full_name", "clients.client_name"}.
        config: Optional configuration dict with keys:
            - "stop_tokens": set of tokens to ignore (default: {"id","code","ref","fk"}).
            - "priority_tokens": set of tokens that, if present in a majority of columns, are preferred (default: {"name"}).
            - "min_common_ratio": float, minimum fraction of columns that must share a token to consider it common (default: 0.5).

    Returns:
        List of dicts: Each dict contains:
            - "entity_name": the suggested canonical name,
            - "columns": sorted list of columns in the group.
    """

    # Set defaults
    if config is None:
        config = {}
    stop_tokens = config.get("stop_tokens", {"id", "code", "ref", "fk"})
    priority_tokens = config.get("priority_tokens", {"name"})
    min_common_ratio = config.get("min_common_ratio", 0.5)

    results = []

    for group in groups:
        tokens_per_column = []
        for col in group:
            # Safely extract the column substring after the LAST dot
            # E.g. "test.json.metadata_source" => "metadata_source"
            col_parts = col.rsplit(".", 1)
            col_name = col_parts[-1]  # fallback is entire string if no dot

            # Tokenize: split on underscores and non-word characters
            parts = re.split(r'[_\W]+', col_name.lower())

            # Remove empty tokens and any in stop_tokens
            filtered_tokens = {t for t in parts if t and t not in stop_tokens}
            tokens_per_column.append(filtered_tokens)

        # Combine tokens from all columns
        all_tokens = [token for tokens in tokens_per_column for token in tokens]
        token_counter = Counter(all_tokens)
        num_columns = len(group)

        # Find tokens that appear in at least min_common_ratio of columns
        common_tokens = [
            t for t, count in token_counter.items()
            if (count / num_columns) >= min_common_ratio
        ]
        # Sort by frequency desc, then alphabetical
        common_tokens.sort(key=lambda t: (-token_counter[t], t))

        # 1) Prefer a token from priority_tokens if it’s in common_tokens
        canonical = None
        for token in common_tokens:
            if token in priority_tokens:
                canonical = token
                break

        # 2) If we have common_tokens but no priority token, pick the top
        if not canonical and common_tokens:
            canonical = common_tokens[0]

        # 3) Fallback: pick the shortest column name from the group
        if not canonical:
            canonical = min(
                [col.rsplit(".", 1)[-1] for col in group],
                key=len
            )

        results.append({
            "entity_name": canonical,
            "columns": sorted(group)
        })

    return results