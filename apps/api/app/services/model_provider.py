import json
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


@dataclass(frozen=True)
class OperationDraft:
    model: str
    summary: str
    operations: list[dict[str, Any]]


class ModelClient:
    def __init__(self) -> None:
        self.azure_key = settings.azure_api_key
        self.openrouter_key = settings.openrouter_api_key

    async def generate_operations(self, prompt: str) -> OperationDraft:
        if self.azure_key:
            return await self._generate_with_azure(prompt)

        if self.openrouter_key:
            return await self._generate_with_openrouter(prompt)

        return OperationDraft(
            model="fallback",
            summary="No model provider is configured yet.",
            operations=[
                {
                    "kind": "note",
                    "target": "runtime",
                    "value": "Set AZURE_API_KEY to enable DeepSeek-backed operation generation.",
                }
            ],
        )

    async def _generate_with_azure(self, prompt: str) -> OperationDraft:
        payload = {
            "model": settings.azure_openai_model,
            "temperature": 0.4,
            "top_p": settings.azure_top_p,
            "max_tokens": 4096,
            "reasoning_effort": settings.azure_reasoning_effort,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.azure_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                settings.azure_openai_chat_completions_url,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return parse_operation_response(settings.azure_openai_model, data)

    async def _generate_with_openrouter(self, prompt: str) -> OperationDraft:
        model = settings.openrouter_model or "anthropic/claude-sonnet-4.5"
        payload = {
            "model": model,
            "temperature": 0.4,
            "max_completion_tokens": 4096,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.public_app_url,
            "X-Title": "Grapeee",
        }
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return parse_operation_response(model, data)


def build_model_client() -> ModelClient:
    return ModelClient()


def parse_operation_response(model: str, data: dict[str, Any]) -> OperationDraft:
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    parsed = parse_jsonish(content)
    return OperationDraft(
        model=model,
        summary=str(parsed.get("summary", "Generated a Grapeee operation draft.")),
        operations=list(parsed.get("operations", [])),
    )


def parse_jsonish(content: str) -> dict[str, Any]:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        return {
            "summary": stripped[:1000],
            "operations": [],
        }
    return parsed if isinstance(parsed, dict) else {"summary": str(parsed), "operations": []}


SYSTEM_PROMPT = """You are Grapeee, an AI agent for Roblox Studio.
Return strict JSON only with:
{
  "summary": "short human-readable summary",
  "operations": [
    {
      "kind": "create_script|update_script|create_instance|set_property|note",
      "target": "Roblox tree path or runtime target",
      "value": "content or structured value",
      "reason": "why this operation is needed"
    }
  ]
}
Prefer small, reversible operations that can be applied through a Rojo-derived runtime.
"""

