from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.model_provider import build_model_client

router = APIRouter()


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=12000)


class PromptDraft(BaseModel):
    model: str
    summary: str
    operations: list[dict]


@router.post("/draft", response_model=PromptDraft)
async def draft_prompt(request: PromptRequest):
    client = build_model_client()
    result = await client.generate_operations(request.prompt)
    return PromptDraft(
        model=result.model,
        summary=result.summary,
        operations=result.operations,
    )

