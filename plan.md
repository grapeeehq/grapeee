# Grapeee Execution Plan

## Thesis

Grapeee should become the open-source, Rojo-based answer to Lemonade: a Roblox Studio agent that lets creators describe a feature, watch it land in Studio, rollback bad iterations, and keep ownership of the runtime that touches their project.

The product is not another AI chat wrapper. The wedge is the full Roblox edit loop:

```text
Prompt -> inspect game/project -> generate operations -> sync into Studio -> observe logs/playtest -> repair -> snapshot/rollback
```

## Foundation

Rojo is the foundation. The runtime should fork Rojo rather than reimplement sync from scratch.

Rojo already has the primitives Grapeee needs:

- local server plus Studio plugin relationship
- filesystem-to-Studio synchronization
- project tree mapping
- patch/update semantics
- mature Rust core
- source map awareness
- a path toward WebSocket-based live sync
- syncback work that can inform reverse Studio-to-files flows

Grapeee should hide Rojo from beginners while keeping its technical strengths.

## Architecture

```text
apps/web       Next.js UI for prompt flow, connection state, history, rollback
apps/api       FastAPI control plane for auth, sessions, model calls, persistence
runtime/       Rojo fork integration point and Grapeee runtime notes
deploy/        Docker, nginx, and production deployment files
old/           Previous prototype, preserved for reference
```

## Runtime Direction

The Grapeee Runtime should start as a Rojo fork with a narrow set of extra APIs:

- `GET /health`
- `GET /sessions/current`
- `GET /studio/tree`
- `POST /operations/apply`
- `POST /snapshots`
- `POST /snapshots/{id}/rollback`
- `GET /logs/stream`

The first implementation should avoid broad Rojo rewrites. Add Grapeee behavior at the API and plugin boundary, keep upstream mergeability intact, and only modify deeper sync internals when the product loop demands it.

## Backend Direction

The Python API is the control plane, not the sync engine.

Responsibilities:

- user auth and account state
- model provider configuration
- prompt/session history
- runtime session metadata
- model orchestration
- generated operation storage
- snapshot metadata
- future billing and team features

Stack:

- FastAPI
- Uvicorn
- Pydantic Settings
- SQLAlchemy
- Alembic
- Postgres
- Dramatiq for queued work
- APScheduler for scheduled cleanup and maintenance
- Resend for transactional email

## Frontend Direction

The web app should feel like the product, not a docs site.

Primary screen:

- active Studio/runtime connection
- prompt composer
- model/provider status
- generated operation preview
- task timeline
- rollback history

Stack:

- Next.js
- React
- Tailwind
- shadcn-style components
- TanStack Query
- React Hook Form
- Zod
- nuqs
- motion
- lucide-react

## Model Direction

Azure DeepSeek V4 Pro is the default cost advantage.

Expected default configuration:

- `AZURE_OPENAI_CHAT_COMPLETIONS_URL=https://cipher-azure.openai.azure.com/openai/v1/chat/completions`
- `AZURE_OPENAI_MODEL=DeepSeek-V4-Pro`
- `AZURE_REASONING_EFFORT=high`
- `AZURE_TOP_P=0.1`

The provider layer must stay swappable:

- Azure OpenAI-compatible DeepSeek
- OpenRouter fallback
- local model later

Model calls should be split by cost:

- strong model: planning, code generation, repair from logs
- cheap model: title, summaries, classification, context ranking

## MVP

1. Fork or vendor Rojo as `runtime/rojo`.
2. Build the upstream runtime locally.
3. Add Grapeee runtime health/session endpoints.
4. Add branded Studio plugin status and connection flow.
5. Build the web prompt screen.
6. Connect web -> API -> runtime.
7. Generate one structured script operation from DeepSeek.
8. Apply it into Studio.
9. Snapshot before mutation.
10. Rollback the snapshot.

## Deployment

Initial production should be simple:

- AWS `t4g.micro`
- Docker Compose
- nginx reverse proxy
- Postgres volume
- API container
- web container
- daily database backup
- healthchecks and restart policies

Target deploy:

```bash
git pull
docker compose build
docker compose up -d
```

## Acquisition

Lead with the strongest hooks:

- Open-source Lemonade
- Built on Rojo
- Bring your own AI key
- Unlimited prompts if your provider allows it
- Rollback every AI change
- Your project stays yours

First demos:

- sword shop
- obby checkpoints
- pet hatching
- farming plots
- simulator loop
- leaderboard/stat saving scaffold

