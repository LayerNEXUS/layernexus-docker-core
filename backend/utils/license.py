# backend/utils/license.py
import os
import requests
import hashlib
import socket
import json
import uuid
from backend.utils.secret_store import get_license_info
from dotenv import load_dotenv

load_dotenv()

KEYGEN_ACCOUNT_ID = ""
PROD_TOKEN = ""


def check_license(license_key):
    return requests.post(
        f"https://api.keygen.sh/v1/accounts/{KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key",
        headers={
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
            },
        data=json.dumps({
            "meta": {
            "key": license_key
            }
        })
        ).json()

def get_machine_fingerprint():
    hostname = socket.gethostname()
    mac = hex(uuid.getnode())
    return hashlib.sha256(f"{hostname}-{mac}".encode()).hexdigest()


def machine_activate(license_id):
  res = requests.post(
    f"https://api.keygen.sh/v1/accounts/{KEYGEN_ACCOUNT_ID}/machines",
    
    headers={
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
      "Authorization": f"Bearer {PROD_TOKEN}"
    },
    
    data=json.dumps({
      "data": {
        "type": "machines",
        "attributes": {
          "fingerprint": get_machine_fingerprint(),
          "platform": "windows",
          "name": "founder"
        },
        "relationships": {
          "license": {
            "data": {
              "type": "licenses",
              "id": license_id
            }
          }
        }
      }
    })
  )
  return res.json()


def list_machines():
    return requests.get(
        f"https://api.keygen.sh/v1/accounts/{KEYGEN_ACCOUNT_ID}/machines",
        headers={
            "Accept": "application/vnd.api+json",
            "Authorization": f"Bearer {PROD_TOKEN}"
        }
    ).json()


def deactivate_machine(machine_id):
    requests.delete(
        f"https://api.keygen.sh/v1/accounts/{KEYGEN_ACCOUNT_ID}/machines/{machine_id}",
        headers={
            "Accept": "application/vnd.api+json",
            "Authorization": f"Bearer {PROD_TOKEN}"
        }
    )


def register_machine_workflow(license_id):
    machines = list_machines()

    fingerprint = get_machine_fingerprint()

    if machines.get("data"):
        current = machines["data"][0]
        
        if current["attributes"]["fingerprint"] != fingerprint:
            deactivate_machine(current["id"])
            response = machine_activate(license_id)
        
        else:
            response = {"status": "already registered"}
    else:
        response = machine_activate(license_id)

    return response


def validate_license_key(license_key):
    try:
        res = requests.post(
            f"https://api.keygen.sh/v1/accounts/{KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key",
            headers={
                "Content-Type": "application/vnd.api+json",
                "Accept": "application/vnd.api+json"
            },
            data=json.dumps({
                "meta": {
                    "key": license_key,
                    "scope": {
                        "fingerprint": get_machine_fingerprint()
                    }
                }
            })
        )
        data = res.json()

        if "errors" in data:
            return {
                "status": "invalid",
                "reason": data["errors"]
            }

        meta = data.get("meta", {})
        license_data = data.get("data", {})

        return {
            "status": "valid" if meta.get("valid") else "invalid",
            "detail": meta.get("detail"),
            "code": meta.get("code"),
            "license_id": license_data.get("id"),
            "expires": license_data.get("attributes", {}).get("expiry"),
            "plan": license_data.get("attributes", {}).get("entitlement")
        }

    except Exception as e:
        return {
            "status": "invalid",
            "reason": str(e)
        }