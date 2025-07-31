from fastapi import FastAPI
from backend.routes import router
from contextlib import asynccontextmanager
from backend.routes import auth
from backend.db import Base, engine, get_db
from backend.models.user import User
from backend.utils.auth import hash_password
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 🧱 Create all tables on startup
    Base.metadata.create_all(bind=engine)

    # 👤 Create default admin user if missing
    db: Session = next(get_db())
    if not db.query(User).filter(User.username == "admin").first():
        user = User(
            username="admin",
            password_hash=hash_password("admin"),
            is_admin=True,
            last_login=datetime.utcnow()
        )
        db.add(user)
        db.commit()

    yield  # App runs here

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)