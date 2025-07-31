from fastapi import APIRouter, Depends
from backend.dependencies.auth import get_current_user
from backend.db import get_db
from backend.models.user import User
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from backend.models.schema_models import SchemaHistory
from sqlalchemy import text

router = APIRouter()

@router.get("/account-summary")
def get_account_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    file_count_stmt = text("""
        SELECT COUNT(DISTINCT value) AS unique_file_count
        FROM schema_history,
        LATERAL jsonb_array_elements_text(uploaded_files) AS file_name(value)
        WHERE username = :username
    """)
    unique_file_count = db.execute(file_count_stmt, {"username": user.username}).scalar()
    
    summary = {
        "usage": {
            "schemas": db.query(SchemaHistory).filter(SchemaHistory.username == user.username).count(),
            "filesUploaded": unique_file_count,
            "aiFixesRun": db.query(SchemaHistory).filter(SchemaHistory.username == user.username).filter(SchemaHistory.is_ai_version == True).count()
        }
    }
    return JSONResponse(content=summary)
