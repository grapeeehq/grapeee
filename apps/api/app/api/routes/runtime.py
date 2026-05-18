from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class RuntimeStatus(BaseModel):
    connected: bool
    mode: str
    message: str


@router.get("/status", response_model=RuntimeStatus)
def read_runtime_status():
    return RuntimeStatus(
        connected=False,
        mode="not-wired",
        message="Grapeee Runtime will be backed by the Rojo fork.",
    )

