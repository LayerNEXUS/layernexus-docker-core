import os
import re
import uuid
from fastapi import UploadFile
import tempfile
from pathlib import Path
from datetime import datetime
from backend.utils.username_sanitizer import sanitize_username

def save_upload_to_temp(upload_file: UploadFile) -> tuple[str, float]:
    """Save file to a temp path and return its size in MB"""
    suffix = Path(upload_file.filename).suffix
    temp = os.path.join(tempfile.gettempdir(), f"layernexus_{uuid.uuid4()}{suffix}")
    size_bytes = 0

    with open(temp, "wb") as f:
        while chunk := upload_file.file.read(1024 * 1024):
            size_bytes += len(chunk)
            f.write(chunk)

    upload_file.file.seek(0)

    size_mb = size_bytes / (1024 * 1024)

    print(f"Temp file written to: {temp}, size: {size_mb:.2f} MB")
    
    return temp, size_mb

def save_user_upload(upload_file: UploadFile, username: str, base_dir="uploads") -> str:
    """
    Save a persistent copy of the uploaded file to the user's directory.
    Returns the full saved path.
    """
    from werkzeug.utils import secure_filename

    safe_username = sanitize_username(username)
    user_dir = os.path.join(base_dir, safe_username)
    os.makedirs(user_dir, exist_ok=True)
    clean_name = secure_filename(upload_file.filename)
    save_path = os.path.join(user_dir, clean_name)

    with open(save_path, "wb") as f:
        upload_file.file.seek(0)  # reset file pointer just in case
        while chunk := upload_file.file.read(1024 * 1024):
            f.write(chunk)

    upload_file.file.seek(0)  # reset again for reuse
    return save_path