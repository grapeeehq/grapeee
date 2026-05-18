from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, prompts, runtime
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Grapeee API",
        version="0.1.0",
        description="Control plane for the Grapeee Roblox Studio agent.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(runtime.router, prefix="/runtime", tags=["runtime"])
    app.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
    return app


app = create_app()

