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
apps/agent     Pi SDK job runner, Grapeee tools, and agent execution contract
runtime/       Rojo fork integration point and Grapeee runtime notes
plugin/        Forked Rojo source and Studio plugin foundation
deploy/        Docker, nginx, and production deployment files
old/           Previous prototype, preserved for reference
```

## Runtime Direction

The production product should not expose a Rojo server port to users. Rojo should be an internal engine used by the Grapeee agent job.

The first Rojo fork work should add JSON-oriented command surfaces around the useful parts:

- `grapeee-rojo resolve --project default.project.json --json`
- `grapeee-rojo validate-ops --ops /input/ops.json --json`
- `grapeee-rojo apply-ops --ops /input/ops.json --out /output/patch.json`
- `grapeee-rojo diff --before /input/a.json --after /input/b.json --json`

The first implementation should avoid broad Rojo rewrites. Add Grapeee behavior at command/API boundaries, keep upstream mergeability intact, and only modify deeper sync internals when the product loop demands it.

The Studio plugin connects outbound to Grapeee over HTTPS/WebSocket. The backend streams approved operations to the connected plugin, and the plugin applies them inside Studio. Rojo helps validate, resolve, and structure those operations; it is not the public transport.

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
- Dramatiq for queued work initially
- Redis or Valkey for queue, locks, websocket presence, and short-lived job state
- APScheduler for scheduled cleanup and maintenance
- Resend for transactional email

The API should not run coding agents inline. It should create an agent job, enqueue it, stream job events to the web UI, and persist the final patch/snapshot result.

## Agent Execution

Pi is the coding-agent runtime. Grapeee should embed Pi through the SDK in `apps/agent`, then provide Grapeee-specific tools.

The agent job container should contain:

- Node/Bun runtime
- Pi SDK
- Grapeee tool definitions
- `grapeee-rojo` binary from `plugin/rojo`
- a job runner entrypoint
- no production database credentials
- only short-lived scoped tokens for model proxy and object storage access

Core tools:

- `read_project_files`
- `read_studio_tree`
- `read_studio_selection`
- `resolve_rojo_tree`
- `validate_rojo_operations`
- `write_patch_file`
- `emit_studio_operations`
- `request_rollback_snapshot`

The job container writes results to `/output`. It does not directly mutate production state, push to users, or talk to the database with broad credentials.

Input contract:

```json
{
  "jobId": "job_123",
  "projectId": "proj_123",
  "threadId": "thread_123",
  "prompt": "make a sword shop",
  "workspaceSnapshotId": "snap_123",
  "studioSessionId": "studio_123",
  "studioTreePath": "/input/studio-tree.json",
  "selectionPath": "/input/selection.json",
  "allowedTools": [
    "read_project_files",
    "resolve_rojo_tree",
    "validate_rojo_operations",
    "emit_studio_operations"
  ]
}
```

Output contract:

```json
{
  "status": "ok",
  "summary": "Generated a server-validated sword shop.",
  "changedFiles": [],
  "studioOperations": [],
  "snapshotPatch": {},
  "eventsPath": "/output/events.jsonl"
}
```

## Workspace Storage

Do not create a long-lived machine per user. A workspace is durable project state plus temporary job files.

Durable state:

- Postgres stores metadata: users, projects, file index, snapshots, prompt iterations, operation history, job records.
- Object storage stores blobs: project files, snapshot archives, generated assets, export artifacts.
- Redis/Valkey stores ephemeral state: job queue, locks, websocket session presence, job heartbeats.

Per job, the worker hydrates a temporary filesystem:

```text
/var/grapeee/jobs/<job_id>/
  input/
    job.json
    studio-tree.json
    selection.json
  workspace/
    default.project.json
    src/
  output/
    result.json
    events.jsonl
```

The worker deletes the temp directory after uploading changed files, events, and snapshots.

## Worker Pool

The default production path should be a warm EC2 worker pool, not one instance per user and not Fargate for every prompt.

Reasoning:

- Agent UX needs fast first progress.
- A warm EC2 worker already has Docker, the agent image, and the Rojo binary cached.
- One short-lived container per prompt gives a clean filesystem and process boundary without paying for idle per-user machines.
- Fargate is useful later for stronger isolation or overflow, but per-prompt cold starts may be too slow for interactive use.

Initial worker topology:

```text
control-plane EC2
  web
  api
  postgres
  redis
  minio optional

worker EC2
  worker-runner
  docker daemon
  pre-pulled grapeee-agent-job image
  /var/grapeee/jobs
```

For very early deployment, the control plane and first worker can live on the same EC2 instance. Split them as soon as agent jobs can disrupt API latency.

The worker-runner owns container lifecycle:

```text
queue job -> hydrate workspace -> docker run grapeee-agent-job -> collect output -> upload results -> cleanup
```

Suggested job container limits:

```bash
docker run --rm \
  --cpus=1 \
  --memory=768m \
  --pids-limit=256 \
  --network=none \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,size=128m \
  -v /var/grapeee/jobs/$JOB_ID/workspace:/workspace:rw \
  -v /var/grapeee/jobs/$JOB_ID/input:/input:ro \
  -v /var/grapeee/jobs/$JOB_ID/output:/output:rw \
  grapeee-agent-job:latest
```

If the agent needs model access, prefer a model proxy instead of raw provider keys inside the job container. The proxy can enforce rate limits, logging, provider routing, and revocation.

## Isolation Path

Start with strict Docker job containers because that is the fastest measurable system.

Upgrade path:

1. Docker with hard limits, no Docker socket, narrow mounts, no broad network.
2. Docker with gVisor/runsc for stronger sandboxing while keeping the same container workflow.
3. Fargate for suspicious users, overflow jobs, or high-isolation paid jobs.
4. Firecracker/microVMs only if job volume and threat model justify owning that complexity.

WASM is not a v1 workspace strategy. It may later be useful for a small deterministic validation kernel, but the Pi SDK agent job and Rojo toolchain should start as normal containerized Linux processes.

## Measurement Plan

We should measure this before overcommitting to any isolation runtime.

Metrics to capture per job:

- queue wait time
- workspace hydration time
- container create time
- container start time
- Pi SDK session boot time
- first model token/event time
- Rojo resolve time
- patch validation time
- output upload time
- total job wall time
- peak RSS and CPU
- container image size

Benchmark matrix:

```text
local Docker on dev machine
warm EC2 Docker
warm EC2 Docker + gVisor
ECS/Fargate RunTask
AWS Batch on Fargate
```

Target thresholds:

- first visible progress under 2 seconds on warm EC2
- container start under 1 second on warm EC2 after image is pulled
- small project hydration under 1 second
- Rojo resolve under 500 ms for small demo projects
- full simple prompt job under 30 seconds excluding model latency

If Fargate cannot show first visible progress quickly enough, it should remain an overflow/high-isolation path rather than the default interactive path.

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

1. Fork Rojo as `plugin/rojo`.
2. Build `grapeee-rojo` JSON commands around resolve, validate, and apply operations.
3. Add `apps/agent` with a Pi SDK job runner.
4. Add `grapeee-agent-job` container image.
5. Add a worker-runner that starts one short-lived job container per prompt.
6. Store workspace files and snapshots in local object storage for the first deployment.
7. Connect Studio plugin outbound to the API websocket.
8. Generate one structured script operation through the Pi SDK agent.
9. Validate the operation with the Rojo fork.
10. Stream the approved operation to Studio.
11. Snapshot before mutation.
12. Rollback the snapshot.

## Deployment

Initial production should be simple:

- AWS `t4g.small` or `t4g.micro` for the control plane
- separate warm worker EC2 when agent jobs become disruptive
- Docker Compose
- nginx reverse proxy
- Postgres volume
- API container
- web container
- worker-runner container
- agent-job image pre-pulled on the worker
- Redis/Valkey container
- local MinIO or direct S3/R2 for blobs
- daily database backup
- daily object storage lifecycle/backup policy
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
