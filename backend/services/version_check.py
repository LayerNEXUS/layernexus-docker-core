from backend.__version__ import __version__ as CURRENT_VERSION
import requests
from packaging import version

def check_version():
    try:
        r = requests.get("https://layernexus.com/version.json", timeout=3)
        remote = r.json()

        if version.parse(CURRENT_VERSION) < version.parse(remote["block_versions_below"]):
            raise RuntimeError(f"🚫 Your LayerNEXUS version {CURRENT_VERSION} is no longer supported. Please update.")

        if version.parse(CURRENT_VERSION) < version.parse(remote["min_supported"]):
            print(f"⚠️ Warning: LayerNEXUS v{CURRENT_VERSION} is nearing end-of-life.")
    except Exception as e:
        print(f"⚠️ Version check failed: {e}")
