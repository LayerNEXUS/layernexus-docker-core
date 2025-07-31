import os
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = ''
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60
APP_VERSION = os.getenv("APP_VERSION", "dev")

class Config:
    UPLOAD_FOLDER = str(Path(__file__).parent.parent / 'uploads')
    ALLOWED_EXTENSIONS = {'csv', 'json'}
    MAX_CONTENT_LENGTH = 1024 * 1024 * 100  # 100MB
    LLM_API_KEY = os.getenv('LLM_API_KEY')  # For column inference

class RelationshipConfig:
    def __init__(self):
        self.min_alias_overlap = 0.7  # Configurable via UI
        self.default_aliases = {
            'user': ['client', 'customer'],
            'product': ['item', 'sku']
        }

    def update_from_ui(self, settings: Dict):
        self.min_alias_overlap = settings.get('min_alias_overlap', self.min_alias_overlap)