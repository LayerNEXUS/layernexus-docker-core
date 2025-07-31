import pandas as pd
import json
from pandas import json_normalize

def json_to_clean_csv(file):
    """
    Convert uploaded JSON file (as UploadFile or file-like object) to cleaned DataFrame.
    Handles various JSON formats: flat lists, nested dicts, API responses, etc.
    """
    try:
        # Decode file content
        content = file.read()
        # Try to decode safely
        try:
            content = content.decode("utf-8-sig")  # handles BOM if present
        except AttributeError:
            # Already str (e.g., if called directly)
            pass

        # Strip leading/trailing whitespace
        content = content.strip()

        # Try loading the JSON
        data = json.loads(content)

        # Case 1: List of records
        if isinstance(data, list):
            df = pd.json_normalize(data, sep="_")

        # Case 2: Single dict
        elif isinstance(data, dict):
            df = pd.json_normalize(data, sep="_")

        else:
            raise ValueError("Unsupported JSON format. Must be list or dict.")
        
        # Optional: stringify nested columns
        df = df.map(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)

        if df.empty:
            raise ValueError("Parsed DataFrame is empty.")

        return df

    except Exception as e:
        print(f"[json_to_clean_csv] Error: {e}")
        return None
