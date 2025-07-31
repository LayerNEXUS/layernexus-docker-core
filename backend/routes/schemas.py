from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db import get_db
from backend.models.schema_models import SchemaHistory, SchemaSavePayload, SchemaUpdateRequest
from backend.dependencies.auth import get_current_user


router = APIRouter()

@router.post("/schemas")
def save_schema(payload: SchemaSavePayload, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Optional: avoid duplicate session_id
    existing = db.query(SchemaHistory).filter_by(session_id=payload.session_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Session ID already exists.")

    schema = SchemaHistory(
        session_id=payload.session_id,
        parent_session_id=payload.parent_session_id,
        username = user.username,
        sql_output=payload.sql_output,
        mermaid_output=payload.mermaid_output,
        source_schema=payload.source_schema,
        composite_pk_info=payload.composite_pk_info,
        rejected_files=payload.rejected_files,
        is_ai_version=payload.is_ai_version
    )

    db.add(schema)
    db.commit()
    db.refresh(schema)

    return {"id": schema.session_id}


@router.put("/schemas/{schema_id}")
def update_schema(
    schema_id: str,
    update: SchemaUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    schema = db.query(SchemaHistory).filter_by(session_id=schema_id).first()
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    # (Optional) Only allow the owner to edit
    if schema.username != user.username:
        raise HTTPException(status_code=403, detail="Not authorized")

    if update.name is not None:
        schema.name = update.name
    if update.tags is not None:
        schema.tags = update.tags

    db.commit()
    return {"success": True, "updated": {"name": schema.name, "tags": schema.tags}}


@router.delete("/schema-store/{schema_id}")
def delete_schema(schema_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    schema = db.query(SchemaHistory).filter(
        SchemaHistory.session_id == schema_id,
        SchemaHistory.username == user.username 
    ).first()

    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    db.delete(schema)
    db.commit()
    return {"success": True, "message": "Schema deleted"}


@router.get("/ai-schema-history")
def get_ai_schema_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)  # use require_user instead of optional_user
):

    schemas = (
        db.query(SchemaHistory)
        .filter(SchemaHistory.username == user.username).filter(SchemaHistory.is_ai_version == True)
        .order_by(SchemaHistory.created_at.desc())
        .all()
    )
    return {
        "schemas":[
        {
            "id": s.session_id,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%m"),
            "summary": s.sql_output[:200] + "..." if s.sql_output else "",
            "sql": s.sql_output,
            "ai_version": s.is_ai_version,
            "name":s.name,
            "tags":s.tags  # ✅ store it
        }
        for s in schemas
    ]
    }
