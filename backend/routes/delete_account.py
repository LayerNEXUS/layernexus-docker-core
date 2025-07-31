from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db import get_db
from backend.models.schema_models import SchemaHistory
from backend.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func
from backend.dependencies.auth import get_current_user

from pathlib import Path
import shutil
from datetime import datetime
from backend.config import Config  # holds UPLOAD_DIR default


router = APIRouter()

UPLOAD_ROOT = Path(Config.UPLOAD_FOLDER)

def _delete_user_files(user_id: str) -> None:
    """Delete the user‑specific upload folder if it exists."""
    user_dir = UPLOAD_ROOT / user_id
    if user_dir.exists():
        shutil.rmtree(user_dir, ignore_errors=True)


# ---------- routes ---------------------------------------------------------

@router.delete(
    "/delete-schemas",
    summary="Delete ALL schemas for current user",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
def delete_all_schemas(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Remove every `SchemaHistory` row for the authenticated user + uploaded files."""
    deleted = (
        db.query(SchemaHistory).filter(SchemaHistory.username == str(user.username)).delete(synchronize_session=False)
    )
    db.commit()

    _delete_user_files(str(user.username))

    return {"success": True, "deleted": deleted, "message": "All schemas deleted"}


@router.delete(
    "/remove-account",
    summary="Delete user account and all related data",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
def remove_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Completely purge a user — schemas + user row + upload folder."""

    # ✅ Save username BEFORE deletion
    username = str(user.username)

    # 1️⃣ Delete schemas first
    db.query(SchemaHistory).filter(SchemaHistory.username == username).delete(synchronize_session=False)

    # 2️⃣ Delete the user row
    db.query(User).filter(User.username == username).delete(synchronize_session=False)
    db.commit()

    # 3️⃣ Now safe to access stored username
    _delete_user_files(username)

    return {"success": True, "message": "Account deleted successfully"}
