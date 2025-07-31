from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from backend.db import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate, UserOut, UserUpdate
from backend.utils.auth import hash_password, verify_password
from backend.utils.token import create_access_token
from backend.dependencies.auth import get_current_user, require_admin
from backend.utils.secret_store import get_openai_api_key, set_openai_api_key
from fastapi.responses import JSONResponse
from datetime import timedelta, datetime
from backend.models.user import User
from backend.utils.token import decode_token


router = APIRouter()

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.utcnow()
    db.commit()

    # Create access and refresh tokens
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(days=7)
    )

    # Set refresh token in an HttpOnly cookie
    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # optional: set to False for localhost testing
        max_age=60 * 60 * 24 * 7,
        samesite="lax"
    )

    return response


@router.post("/auth/refresh-token")
def refresh_token(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_token = create_access_token(data={"sub": user.username})
    return {"access_token": new_token, "token_type": "bearer"}

@router.post("/auth/create-user")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check global user count
    user_count = db.query(User).count()
    if user_count >= 5:
        raise HTTPException(status_code=400, detail="User limit reached (max 5 users)")

    # Check for duplicate username
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create new user
    new_user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        is_admin=user_data.is_admin,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at,
            "last_login": new_user.last_login,
        }
    }

@router.get("/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/auth/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
            "last_login": u.last_login,
        }
        for u in users
    ]

@router.delete("/auth/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"success": True}


@router.put("/auth/users/{user_id}")
def update_user(
    user_id: int,
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for username conflicts (if changed)
    if user.username != update.username:
        conflict = db.query(User).filter(User.username == update.username).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Username already exists")

    user.username = update.username
    user.password_hash = hash_password(update.password)
    user.is_admin = update.is_admin
    db.commit()
    return {"success": True}

@router.get("/admin/openai-key")
def get_key(current_user: User = Depends(get_current_user)):
    return {"openai_api_key": get_openai_api_key()}

@router.post("/admin/openai-key")
def update_key(data: dict, current_user: User = Depends(require_admin)):
    set_openai_api_key(data["openai_api_key"])
    return {"success": True}

