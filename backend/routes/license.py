from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.utils.secret_store import get_license_info, set_license_key
from backend.dependencies.auth import get_current_user
from backend.utils.license import validate_license_key, register_machine_workflow, check_license

router = APIRouter()

class LicenseInput(BaseModel):
    license_key: str



@router.get("/license/status")
def check_license_ready():
    info = get_license_info()
    if info.get("license_key"):
        result = validate_license_key(info["license_key"])
        return { "ready": result["status"] == "valid", **result }
    return { "ready": False }


@router.post("/license/setup")
def store_license_key(data: LicenseInput):
    if not data.license_key:
        raise HTTPException(status_code=400, detail="License key required")
    
    license_first_check = check_license(data.license_key)
        
    if check_license(data.license_key).get('data') is None:
        raise HTTPException(status_code=400, detail="License not found")
        
        
    set_license_key(data.license_key)

    register_machine_workflow(license_first_check.get('data')['id'])
   
    return { "message": "License key saved" }


@router.get("/admin/license", dependencies=[Depends(get_current_user)])
def get_license_status():
    info = get_license_info()
    if not info.get("license_key"):
        raise HTTPException(status_code=400, detail="No license key stored")
    return validate_license_key(info["license_key"])


@router.get("/license/activate")
def register_machine():
    info = get_license_info()
    if not info.get("license_key"):
        raise HTTPException(status_code=400, detail="No license key stored")
    return register_machine_workflow(info["license_key"])