import re

def sanitize_username(username: str) -> str:
    """
    Replaces any non-alphanumeric characters or usernames starting with numbers
    with underscores to safely use as a folder name.
    """
    return re.sub(r"\W|^(?=\d)", "_", username)