from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("")
def read_health():
    return {
        "ok": True,
        "service": "grapeee-api",
        "environment": settings.environment,
    }

