# backend/utils/secret_store.py
import logging

import json
import os

SECRETS_PATH = '/app/backend/secrets.json'

def load_secrets():
    if not os.path.exists(SECRETS_PATH):
        return {}
    try:
        with open(SECRETS_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        logging.warning(f"[License] Failed to load secrets.json: {e}")
        return {}

def save_secrets(data):
    os.makedirs(os.path.dirname(SECRETS_PATH), exist_ok=True)
    with open(SECRETS_PATH, "w") as f:
        json.dump(data, f, indent=2)

# OPENAI key (still supported)
def get_openai_api_key():
    return load_secrets().get("openai_api_key")

def set_openai_api_key(key: str):
    secrets = load_secrets()
    secrets["openai_api_key"] = key
    save_secrets(secrets)

# 🔐 LICENSE key
def get_license_info():
    secrets = load_secrets()
    return {
        "license_key": secrets.get("license_key"),
        "openai_api_key": secrets.get("openai_api_key")
    }

def set_license_key(key: str):
    secrets = load_secrets()
    secrets["license_key"] = key
    save_secrets(secrets)
