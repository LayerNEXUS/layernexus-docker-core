from fastapi import APIRouter, Request
from backend.utils.schema_loader import load_schema
from backend.services.sql_generator import SQLGenerator, generate_mermaid

router = APIRouter()

@router.post("/regenerate-sql")
async def regenerate_sql(req: Request):
    try:
        data = await req.json()
        session_id = data["session_id"]
        dialect = data.get("dialect", "postgres")

        loaded_schema = load_schema(session_id)

        normalized_schema = {
            table: {
                col: {
                    "type": col_meta.detected_type,
                    "nullable": col_meta.null_percent > 0.0,
                    "canonical_name": getattr(col_meta, "canonical_name", None)
                }
                for col, col_meta in profile.columns.items()
            }
            for table, profile in loaded_schema.items()
        }

        keys = {
            "primary_keys": {
                table: [{"column": col.name, "selected": True}]
                for table, col in loaded_schema.items()
                if col.columns
            },
            "foreign_keys": []  # 💡 You can add FK support later if needed
        }

        sql = SQLGenerator().generate_ddl(normalized_schema, keys, dialect)
        mermaid = generate_mermaid(normalized_schema, keys)

        return {
            "sql": sql,
            "mermaid": mermaid
        }

    except Exception as e:
        return {"error": str(e)}
