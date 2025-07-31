from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
from backend.db import Base  
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class SchemaHistory(Base):
    __tablename__ = "schema_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=False, index=True, unique=True)
    parent_session_id = Column(String(64), nullable=True)  # ✅ Link to original upload
    username = Column(String(64), nullable=True)  # nullable for demo users
    sql_output = Column(Text, nullable=True)
    mermaid_output = Column(Text, nullable=True)
    composite_pk_info = Column(JSONB, nullable=True)
    source_schema = Column(JSONB, nullable=True)
    rejected_files = Column(JSONB, nullable=True)
    is_ai_version = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow())
    uploaded_files = Column(JSONB, nullable=True)
    name = Column(String, nullable=True)
    tags = Column(ARRAY(String), default=[])


class UserUpload(Base):
    __tablename__ = "user_uploads"

    id = Column(Integer, primary_key=True)
    username = Column(String(64), nullable=False)
    filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    file_type = Column(String, nullable=True)  # 'csv', 'json', etc.

class SchemaSavePayload(BaseModel):
    session_id: str
    parent_session_id: Optional[str] = None
    user_id: Optional[str] = None
    sql_output: Optional[str] = None
    dbml_output: Optional[str] = None
    mermaid_output: Optional[str] = None
    source_schema: Optional[Dict[str, Any]] = None
    composite_pk_info: Optional[Dict[str, Any]] = None
    rejected_files: Optional[Dict[str, Any]] = None
    is_ai_version: bool = True

class ColumnProfile(BaseModel):
    name: str
    detected_type: str  # e.g., "INT", "VARCHAR(255)"
    unique_ratio: float  # Between 0.0-1.0
    null_percent: float  # Between 0.0-1.0
    sample_values: List[str] = []
    is_autoincrement: bool = False
    canonical_name: Optional[str] = None

    # 🔽 New Optional Metadata (for display, inference, documentation)
    is_primary_key: Optional[bool] = False
    is_foreign_key_to: Optional[str] = None  # format: "table.column"
    semantic_type: Optional[str] = None  # e.g. "email", "name", "currency"
    llm_column_description: Optional[str] = None  # Human-readable summary
    original_column_name: Optional[str] = None  # Pre-cleaned name (if renamed)

class TableProfile(BaseModel):
    name: str
    columns: Dict[str, ColumnProfile]  # Key: column name
    file_path: str

class RelationshipCandidate(BaseModel):
    source_table: str
    source_column: str
    target_table: str
    target_column: str
    confidence: float  # 0.0-1.0
    match_type: str  # "exact", "fuzzy", "inferred"
    reason: str  # Explanation of match

class SchemaUpdateRequest(BaseModel):
    name: Optional[str] = None
    tags: Optional[List[str]] = None