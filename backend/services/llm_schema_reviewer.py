# backend/services/llm_schema_reviewer.py

from openai import OpenAI
import os
from dotenv import load_dotenv
from backend.db import get_db
from sqlalchemy.orm import Session
from backend.utils.secret_store import get_license_info

def review_schema_with_llm(sql_schema: str, sql_dialect:str, db: Session, user) -> str:

    API = get_license_info()['openai_api_key']
    client = OpenAI(api_key=API)

    """
    Review the SQL schema using GenAI.
    Assumes credits have already been checked & deducted by the caller.
    Returns cleaned schema, or fallback on error.
    """

    schema_requirement_dict = {
        "POSTGRES": "**[PostgreSQL DDL]** — Use `GENERATED ALWAYS AS IDENTITY`, `TEXT`, `TIMESTAMPTZ`, `ENUM`, `JSONB`, partial and GIN/BRIN indexes, `pgcrypto` for field-level encryption, `ValidFrom/ValidTo` for history tracking, row-level security via `POLICY`",
        "MYSQL": "**[MySQL DDL]** — Use `AUTO_INCREMENT`, `InnoDB` engine, `utf8mb4_0900_ai_ci` collation, `DATETIME(6)`, descending and BTREE indexes (MySQL 8+), `ENUM`, and include `ValidFrom/ValidTo` timestamp ranges in normalized designs.",
        "SQLITE": "**[SQLite DDL]** — Use `INTEGER PRIMARY KEY AUTOINCREMENT`, `TEXT`, `NUMERIC`, `REAL`, `COVERING` indexes (where available), optional `FOREIGN KEY` enforcement via `PRAGMA`, and include `created_at` / `updated_at` tracking. Use SQLite Encryption Extension (SEE) for secure fields.",
        "ORACLE": "**[Oracle DDL]** — Use `NUMBER GENERATED ALWAYS AS IDENTITY`, `VARCHAR2`, `CLOB`, `TIMESTAMP`, `COMPRESS ADVANCED`, `STORING` indexes, `ENABLE VALIDATE` constraints, include `ValidFrom/ValidTo` for historical tables, and secure storage using Oracle Transparent Data Encryption (TDE).",
        "SQLSERVER": "**[SQL Server DDL]** — Use `INT IDENTITY(1,1)`, `NVARCHAR`, `BIT`, `DATETIME2`, `INCLUDE` indexes, `DATA_COMPRESSION = PAGE`, row-level security policies, `Always Encrypted` for sensitive fields, `ValidFrom/ValidTo` temporal columns, and `COMMENT` via `sp_addextendedproperty`."
    }

    
    prompt = f"""
            You are a senior database architect with 20+ years of experience modeling high-performance OLTP systems across multiple RDBMS platforms. 
            Analyze and transform this denormalized schema into a fully normalized 3NF design following these strict guidelines:

            --CRITICAL REQUIREMENTS--
            1. **Database Selection**: 
            - Generate schema for {sql_dialect.upper()}
            - Use appropriate SQL dialect and features
            - Apply vendor-specific optimizations

            2. **Schema Analysis**:
            - Identify ALL missing foreign key relationships
            - Flag columns belonging in different tables
            - Detect denormalized/repeated data patterns
            - Verify RDBMS-appropriate data types

            3. **Normalization Rules**:
            - Atomic values in all columns
            - No partial/key transitive dependencies
            - ALL non-key columns must depend ONLY on PK
            - Eliminate multi-valued attributes
            - Historical tracking where values change

            4. **Structural Integrity**:
            - Auto-increment/identity PKs for ALL entities (vendor-specific implementation)
            - Explicit FK constraints with RDBMS-appropriate ON UPDATE/DELETE rules
            - Unique constraints for natural keys
            - Proper junction tables for M:N relationships
            - RDBMS-specific storage optimization

            5. **Naming Standards**:
            - PKs: TableNameID 
            - FKs: ReferencedTableNameID 
            - Junction tables: Table1Table2 
            - Temporal tables: TableHistory

            6. **Indexing Recommendations**:
            - Create indexes on commonly queried columns
            - Always index foreign keys
            - Add composite indexes for frequent multi-column filters
            - Use vendor-specific index features
            - Place `CREATE INDEX` statements after table definitions in the output

            7. **DONT NEED TO PROVIDE EXPLANATION**

            --OUTPUT SPECIFICATIONS--
            Database: {sql_dialect.upper()}
            {schema_requirement_dict[sql_dialect.upper()]}

            --BEGIN CLEANED SQL--
            /* Vendor-specific DDL with:
            - Auto-increment/identity columns
            - Appropriate storage engines
            - Correct charset/collation
            - Column comments
            - Check constraints
            - Optimized indexes
            - Temporal tables */
            [DBMS_SPECIFIC_DDL]
            --END CLEANED SQL--

            --BEGIN MERMAID--
            erDiagram
            /* DBMS-agnostic ERD showing:
            - Tables/columns with generic types
            - Relationships with cardinality
            - Crow's foot notation
            - PK/FK connections */
            [ER_DIAGRAM]
            --END MERMAID--

            --INPUT SCHEMA TO PROCESS--
            {sql_schema}
""" 
    try: # AI Response - Return Cleaned Schema Using GPT-4o for better response
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt.strip()}],
            temperature=0.2
        )
        
        cleaned_sql = response.choices[0].message.content.strip() 

        return cleaned_sql

    except Exception as e:
        print("❌ LLM schema review failed:", str(e))
        return sql_schema  # fallback to original
