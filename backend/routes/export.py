import os
import re
from fastapi import APIRouter, UploadFile, File, Request, Depends
from backend.dependencies.auth import get_current_user
from backend.utils.file_utils import save_user_upload
from backend.db import get_db
from sqlalchemy.orm import Session
from typing import List
from backend.services.schema_runner import run_schema_inference


router = APIRouter()

def sanitize_table_name(filename: str) -> str:
    base = os.path.splitext(filename)[0]
    return re.sub(r'\W|^(?=\d)', '_', base.lower())


@router.post("/generate-ddl")
async def generate_ddl(
    files: List[UploadFile] = File(...),
    use_llm: str = 'false',
    request: Request = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses CSV/JSON files, infers schema, triggers PII masking, 
    and returns DDL + ERD representations.
    """

    use_llm = (use_llm.lower() == "true")

    try:
        file_paths = []
        for file in files:
            # Save file to user directory
            permanent_path = save_user_upload(file, user.username)
            file_paths.append(permanent_path)

        result = run_schema_inference(file_paths, user.username, use_llm, db)
        return result

    except Exception as e:
        print("Error in generate_ddl endpoint:", e)
        raise e