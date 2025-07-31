from ..config import Config
from charset_normalizer import from_bytes
import os

ALLOWED_EXTENSIONS = {'.csv', '.json'}
MAX_FILE_SIZE_MB = 100

def check_file_validity(filename: str, size_mb: float):
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"{filename} must be .csv or .json")
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"{filename} exceeds {MAX_FILE_SIZE_MB}MB limit")


def get_file_stats(file_path):
    """Get basic file statistics for conflict detection"""
    # Implementation for row count, null percentages, etc.
    pass

def detect_encoding(file_obj) -> str:
    """
    Detect file encoding using charset-normalizer
    """
    raw_bytes = file_obj.read()
    file_obj.seek(0)  # Reset file pointer
    result = from_bytes(raw_bytes).best()
    return result.encoding if result else 'utf-8'