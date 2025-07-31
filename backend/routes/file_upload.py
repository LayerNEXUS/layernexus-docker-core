import os
import re
import json
from fastapi import APIRouter, HTTPException, Depends
from pathlib import Path
from typing import Dict
from backend.dependencies.auth import get_current_user
from backend.models.user import User
from backend.db import get_db
from sqlalchemy.orm import Session
from backend.services.schema_runner import run_schema_inference
from backend.utils.username_sanitizer import sanitize_username
from backend.models.schema_models import SchemaHistory

router = APIRouter()

@router.get("/rejected-files/{session_id}")
async def get_rejected_files(session_id: str, db: Session = Depends(get_db)):
    schema = db.query(SchemaHistory).filter(
        SchemaHistory.session_id == session_id
    ).first()

    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    return {
        "rejected_files": schema.rejected_files or {}  # Safe fallback
    }
    
@router.get("/user/files")
def list_user_files(current_user: dict = Depends(get_current_user)):
    safe_username = sanitize_username(current_user.username)
    user_dir = os.path.join("uploads", safe_username)
    if not os.path.exists(user_dir):
        return {"files": []}
    files = sorted(os.listdir(user_dir), reverse=True)
    return {"files": files}


@router.post("/reprocess")
def reprocess_files(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    filenames = payload.get("filenames", [])
    safe_username = sanitize_username(current_user.username)
    user_dir = os.path.join("uploads", safe_username)

    valid_paths = [
        os.path.join(user_dir, f)
        for f in filenames
        if os.path.exists(os.path.join(user_dir, f))
    ]

    if not valid_paths:
        raise HTTPException(status_code=400, detail="No valid files found for reprocessing.")

    # 🔁 Run same logic as /generate-ddl but without UploadFile
    result = run_schema_inference(valid_paths, current_user.username, use_llm=False, db=db)
    return result

