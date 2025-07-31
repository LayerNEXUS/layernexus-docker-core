from collections import OrderedDict
import sqlparse
import re
from backend.models.schema_models import ColumnProfile, TableProfile
from datetime import datetime

class SQLGenerator:
    def generate_ddl(self, normalized_schema, keys, session_id, composite_pk_fallbacks=None):
        """
        Generate SQL DDL statements (CREATE TABLE + ALTER TABLE for FKs).
        
        Args:
            normalized_schema: Dict[table_name] = OrderedDict[column_name -> column_meta]
            keys: {
                "primary_keys": {table_name: [ {"column": ..., "selected": True} ]},
                "foreign_keys": [ {"source_table": ..., "source_column": ..., "target_table": ..., "target_column": ...} ]
            }

        Returns:
            str: Full SQL script
        """
        ddl = []

        for table, columns in normalized_schema.items():
            # Column definitions
            col_defs = []
            for col_name, meta in columns.items():
                col_type = meta.get('type', 'TEXT')  # default to TEXT if type unknown
                nullable = meta.get('nullable')      # can be True, False, or None

                col_def = f"{col_name} {col_type}"

                # Handle NULL/NOT NULL explicitly
                if nullable is False:
                    col_def += " NOT NULL"
                elif nullable is True:
                    col_def += " NULL"
                else:
                    col_def += " NULL"  # default to NULL if unspecified

                # Optional: comment for canonical name if exists
                canonical = meta.get("canonical_name")
                if canonical and canonical != col_name:
                    col_def += ","  # ✅ Always add comma first
                    col_def += f" -- suggested: {canonical}"

                col_defs.append(col_def)

            # Add primary key: either normal or composite fallback
            pk_info = next(
                (pk for pk in keys.get('primary_keys', {}).get(table, []) if pk.get('selected')),
                None
            )

            if pk_info:
                col_defs.append(f"PRIMARY KEY ({pk_info['column']})")

            elif composite_pk_fallbacks and table in composite_pk_fallbacks:
                col_str = ", ".join(composite_pk_fallbacks[table]["columns"])
                col_defs.append(f"PRIMARY KEY ({col_str})")

            # Create table statement
            ddl.append(
                f"CREATE TABLE {table} (\n  " +
                ",\n  ".join(col_defs) +
                "\n);"
            )

        # Foreign keys
        for fk in keys['foreign_keys']:
            src_table = fk['source_table']
            src_column = fk['source_column']
            tgt_table = fk['target_table']
            tgt_column = fk['target_column']

            warnings = []

            # 🛡️ Orphan check
            if tgt_table not in normalized_schema:
                continue

            if tgt_column not in normalized_schema[tgt_table]:
                continue

            # ✅ Add valid FK
            ddl.append(
                f"ALTER TABLE {src_table} ADD FOREIGN KEY ({src_column}) "
                f"REFERENCES {tgt_table} ({tgt_column});"
            )
        
        return "\n".join(ddl)


def generate_mermaid(schema, keys):
    lines = ["erDiagram"]
    for table, columns in schema.items():
        lines.append(f"{table} {{")
        for col_name, col_meta in columns.items():
            dtype = col_meta["type"].split("(")[0].upper()
            is_pk = any(pk["column"] == col_name for pk in keys["primary_keys"].get(table, []))
            is_fk = any(fk["source_table"] == table and fk["source_column"] == col_name for fk in keys["foreign_keys"])
            role = "PK" if is_pk else "FK" if is_fk else ""
            lines.append(f"        {dtype} {col_name} {role}".strip())
        lines.append("    }")

    for fk in keys["foreign_keys"]:
        lines.append(
            f"    {fk['target_table']} ||--o{{ {fk['source_table']} : has"
        )

    return "\n".join(lines)

def generate_dbml(schema, keys):
    lines = []

    for table, columns in schema.items():
        lines.append(f"Table {table} {{")
        pk_columns = {
            pk["column"]
            for pk in keys["primary_keys"].get(table, [])
        }

        for col_name, col_meta in columns.items():
            dtype = col_meta["type"].upper()
            tags = []

            if col_name in pk_columns:
                tags.append("primary key")
            elif not col_meta["nullable"]:
                tags.append("not null")

            tag_str = f" [{', '.join(tags)}]" if tags else ""
            lines.append(f"  {col_name} {dtype}{tag_str}")
        lines.append("}")

    for fk in keys["foreign_keys"]:
        lines.append(
            f"Ref: {fk['source_table']}.{fk['source_column']} > {fk['target_table']}.{fk['target_column']}"
        )

    return "\n".join(lines)


class SQLParser:
    def parse_sql(self, sql: str):
        """
        Parse cleaned SQL string back into structured schema format
        usable for generate_mermaid / generate_dbml.
        """
        statements = sqlparse.parse(sql)
        schema = {}
        keys = {
            "primary_keys": {},
            "foreign_keys": []
        }

        for stmt in statements:
            stmt_str = str(stmt)
            table_match = re.search(r'CREATE TABLE (\w+)', stmt_str, re.IGNORECASE)
            if not table_match:
                continue

            table_name = table_match.group(1)
            schema[table_name] = {}

            # Extract columns and keys
            column_lines = stmt_str.split("\n")
            for line in column_lines:
                line = line.strip().rstrip(",")

                # Match PRIMARY KEY
                pk_match = re.match(r'PRIMARY KEY \((\w+)\)', line, re.IGNORECASE)
                if pk_match:
                    col = pk_match.group(1)
                    keys["primary_keys"][table_name] = [{"column": col, "selected": True}]
                    continue

                # Match FOREIGN KEY
                fk_match = re.match(
                    r'FOREIGN KEY \((\w+)\) REFERENCES (\w+) \((\w+)\)', line, re.IGNORECASE)
                if fk_match:
                    source_col, target_table, target_col = fk_match.groups()
                    keys["foreign_keys"].append({
                        "source_table": table_name,
                        "source_column": source_col,
                        "target_table": target_table,
                        "target_column": target_col
                    })
                    continue

                # Match column definition
                col_match = re.match(r'(\w+)\s+([A-Z]+(?:\(\d+\))?)(.*)', line)
                if col_match:
                    col_name, col_type, rest = col_match.groups()
                    is_nullable = "NOT NULL" not in rest.upper()
                    schema[table_name][col_name] = {
                        "type": col_type,
                        "nullable": is_nullable,
                        "canonical_name": None
                    }

        return schema, keys