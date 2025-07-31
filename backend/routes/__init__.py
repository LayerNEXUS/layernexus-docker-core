from fastapi import APIRouter
from .auth import router as login
from .license import router as license_check
from .ai_cleanup import router as ai_router
from .file_upload import router as file_upload_router
from .schemas import router as ai_schemas
from .export import router as export_router
from .delete_account import router as delete_all_schemas
from .file_upload import router as file_upload_router
from .account_summary import router as acc_summary

router = APIRouter()
router.include_router(login)
router.include_router(license_check)
router.include_router(export_router)
router.include_router(ai_router)
router.include_router(delete_all_schemas)
router.include_router(file_upload_router)
router.include_router(ai_schemas)
router.include_router(acc_summary)