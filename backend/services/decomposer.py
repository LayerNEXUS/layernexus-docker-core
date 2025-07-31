from typing import Dict, List
from backend.models.schema_models import TableProfile, ColumnProfile

def decompose_flat_file_3nf(
    table_name: str,
    table_profile: TableProfile,
    grouped_entities: List[Dict]
) -> Dict[str, TableProfile]:
    """
    Decomposes a flat table into 3NF schema by handling primary keys and foreign keys.

    Args:
        table_name (str): Original table name of the flat file
        table_profile (TableProfile): Profile of the flat table (columns, file path, etc.)
        grouped_entities (List[Dict]): Entity groups, each a dict like:
            {
              "entity_name": "some_entity",
              "columns": ["table.colA", "table.colB"],
              "primary_key": ["colA"]
            }

    Returns:
        Dict[str, TableProfile]: Dictionary of new TableProfiles (entity tables + base table),
                                 with foreign keys added to the base table where appropriate.
    """

    entity_tables = {}
    remaining_columns = set(table_profile.columns.keys())
    foreign_keys = {}

    for group in grouped_entities:
        entity_name = group.get("entity_name")
        if not entity_name:
            continue  # skip if missing a name

        pk_columns = group.get("primary_key", [])
        all_columns = group.get("columns", [])

        # Ensure pk_columns are a subset of all_columns
        if not all(pk in [col.rsplit(".", 1)[-1] if "." in col else col for col in all_columns]
                   for pk in pk_columns):
            # Invalid group or mismatch in columns
            continue

        # Build the entity's column profiles
        entity_cols = {}
        for col_ref in all_columns:
            # Safely extract the column name after the last dot
            # E.g. "test.json.metadata_source" -> "metadata_source"
            col_parts = col_ref.rsplit(".", 1)
            col_name = col_parts[-1]  # fallback to the entire string if no dot

            if col_name in table_profile.columns:
                entity_cols[col_name] = table_profile.columns[col_name]
                remaining_columns.discard(col_name)

        # If we managed to map columns for this entity
        if entity_cols:
            # Mark primary key columns
            for pk in pk_columns:
                if pk in entity_cols:
                    entity_cols[pk].is_primary_key = True

            entity_tables[entity_name] = TableProfile(
                name=entity_name,
                columns=entity_cols,
                file_path=table_profile.file_path
            )

            # Track these pk columns so we can add FKs in the base table
            foreign_keys[entity_name] = pk_columns

    # Now add foreign keys to the base table for each entity
    for entity, pk_cols in foreign_keys.items():
        for pk in pk_cols:
            if pk in table_profile.columns and pk not in remaining_columns:
                # The original PK column was moved to the entity table,
                # so we create a foreign key in the base table referencing it
                fk_col_name = f"{entity}_{pk}"

                # Clone data type from the original PK column
                pk_col_profile = table_profile.columns[pk]
                fk_col = ColumnProfile(
                    name=fk_col_name,
                    data_type=pk_col_profile.data_type,
                    is_foreign_key=True,
                    references=f"{entity}.{pk}"
                )

                remaining_columns.add(fk_col_name)
                table_profile.columns[fk_col_name] = fk_col

    # Finally, create or update the base table with whatever remains
    if remaining_columns:
        base_cols = {
            col: table_profile.columns[col]
            for col in remaining_columns
        }
        entity_tables[table_name] = TableProfile(
            name=table_name,
            columns=base_cols,
            file_path=table_profile.file_path
        )

    return entity_tables
