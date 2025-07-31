import re
from fastapi import APIRouter, Request, HTTPException, Depends
from backend.db import get_db
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.services.llm_schema_reviewer import review_schema_with_llm
from backend.dependencies.auth import get_current_user

router = APIRouter() # register router

class SQLInput(BaseModel):
    sql: str
    dialect: Optional[str] = "postgres"

@router.post("/fix-with-ai") # AI Cleaning Function End point
async def fix_with_ai(
    payload: SQLInput,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_sql = payload.sql # SQL from the from the upload file
    sql_dialect = payload.dialect

    if not raw_sql:
        raise HTTPException(status_code=400, detail="Missing SQL input")     
    
    try:
        llm_response = review_schema_with_llm(raw_sql, sql_dialect, db=db, user=user)

        cleaned_sql_match = re.search(r"--BEGIN CLEANED SQL--(.*?)--END CLEANED SQL--", llm_response, re.DOTALL)
        mermaid_text_match = re.search(r"--BEGIN MERMAID--(.*?)--END MERMAID--", llm_response, re.DOTALL)

        cleaned_sql_text = cleaned_sql_match.group(1).strip() if cleaned_sql_match else raw_sql
        mermaid_text_str = mermaid_text_match.group(1).strip() if mermaid_text_match else ""

        return {
            "sql": cleaned_sql_text,
            "mermaid": mermaid_text_str
            }

    except Exception as e:
        # Optional: log or include the error message for debugging
        return {
            "error": "GenAI cleanup failed",
            "sql": raw_sql
        }
