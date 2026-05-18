# Grapeee Plan

## Thesis

Grapeee should become the open-source, Rojo-based answer to Lemonade: a Roblox Studio agent that lets creators describe a feature, watch it land in Studio, rollback bad iterations, and keep ownership of the underlying runtime.

The product should not be framed as another chat wrapper. The wedge is the full Roblox edit loop:

```text
Prompt -> inspect game/project -> generate patch -> sync into Studio -> playtest/logs -> repair -> snapshot/rollback
```

Lemonade proves the demand: creators want a fast, low-friction way to turn ideas into working Roblox prototypes. Grapeee can compete by being cheaper, open-source, self-hostable, model-flexible, and technically transparent.

## Positioning

**Short pitch:**  
Open-source Lemonade for Roblox Studio. Bring your own AI key, keep control of your project, and rollback every prompt.

**Longer pitch:**  
Grapeee is an AI development runtime for Roblox. It combines a Rojo-derived Studio sync engine, a local companion, and a web UI so creators can build directly inside Roblox Studio from natural-language prompts without giving up project ownership.

**Core contrast:**

- Lemonade: polished hosted product, closed runtime, prompt limits, fast beginner UX.
- Grapeee: open runtime, bring-your-own-key, rollback-first, self-hostable, developer-trust story.
- Roblox Assistant: built into Studio, but less programmable as an external agent runtime.
- Generic AI editors: good at code, weak at live Studio context and Roblox-specific project mutation.

## Strategic Read

The correct foundation is Rojo, not a fresh sync layer.

Rojo already contains the hard parts Grapeee needs:

- a Studio plugin and local server relationship
- filesystem-to-Studio synchronization
- project tree mapping
- patch/update semantics
- source map awareness
- a mature Rust core
- a path toward WebSocket-based live sync
- emerging syncback support for pulling Studio state back into files

The mistake would be exposing Rojo as Rojo. The user-facing product should hide the tooling and feel like a single connected Roblox agent.

Beginners should experience:

1. Install Grapeee plugin.
2. Open Roblox Studio.
3. Sign in/connect.
4. Type: "make a sword shop with coins and purchase buttons."
5. See scripts, UI, remotes, and folders appear.
6. Click rollback if it is bad.

Experienced developers should still benefit from the same runtime because the underlying changes are inspectable, file-backed, and compatible with real Roblox workflows.

## Product Principles

- **Studio-first feel:** The product must feel like it changes the open Roblox place, not like it edits abstract files.
- **Rojo-powered core:** Fork or deeply integrate Rojo for sync, mapping, and plugin transport.
- **Rollback every prompt:** Every agent action creates a reversible snapshot.
- **Model-flexible:** Azure DeepSeek should be the default cost advantage, but the provider layer must support OpenRouter and future local models.
- **Open-source trust:** Users should be able to inspect the runtime that touches their game.
- **Fast dopamine loop:** The first successful prompt should happen within minutes of landing on the site.
- **Do not overteach:** The UI can be technically honest without forcing beginners to learn Rojo on day one.

## Architecture

### 1. Grapeee Runtime

Fork Rojo and evolve it into a bundled local runtime.

Responsibilities:

- connect to the Grapeee Studio plugin
- represent the live Roblox tree
- sync generated file/model changes into Studio
- support reverse extraction/syncback where possible
- expose a local API to the web/backend layer
- provide snapshot and rollback primitives
- stream Studio logs, errors, and playtest state

Initial direction:

- keep the Rust core
- preserve Rojo's existing protocol and project mapping where useful
- add Grapeee-specific API routes around sessions, snapshots, patch application, and Studio inspection
- keep the fork close enough to upstream that future Rojo improvements can be merged selectively

### 2. Studio Plugin

The plugin is the user-visible bridge.

Responsibilities:

- connect the open Studio session to Grapeee Runtime
- expose hierarchy, selection, scripts, services, and output logs
- apply runtime patches into Studio
- trigger playtests where feasible
- display lightweight status, not a full app

The plugin should be deliberately small. The main UX lives in the web app, while the plugin proves that Studio is connected and gives the runtime permission to act.

### 3. Backend

Python backend is the hosted control plane, not the sync engine.

Recommended stack:

- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- Alembic
- Postgres
- Dramatiq only when queued work becomes necessary
- Redis only when jobs/sessions need it
- Resend for early transactional email

Responsibilities:

- auth and account state
- API key/provider configuration
- prompt/session history
- billing or usage limits later
- project/session metadata
- orchestration of model calls
- prompt iteration records
- team/collaboration features later

### 4. Frontend

Recommended stack:

- Next.js
- React
- Tailwind
- shadcn/ui
- TanStack Query
- React Hook Form
- nuqs
- motion.dev

Primary surfaces:

- landing page with immediate "Start building" flow
- connected Studio session page
- chat/prompt composer
- task timeline
- generated changes panel
- rollback history
- model/key settings
- install/connect onboarding

The main screen should be the working product, not a marketing page. The first viewport should communicate: connected Studio session, prompt box, current project, last changes, rollback.

### 5. Model Layer

Azure DeepSeek V4 Pro should be treated as the near-term unfair advantage.

Default provider:

- endpoint: Azure OpenAI-compatible chat completions
- model: `DeepSeek-V4-Pro`
- reasoning effort: `high` by default
- max tokens: large enough for multi-file patches and repair loops

Provider abstraction:

- `generate_plan`
- `generate_patch`
- `repair_from_logs`
- `summarize_context`
- `name_task`
- `classify_intent`

Use the strongest model only for planning, codegen, and repair. Use cheaper routes for summaries, labels, retrieval ranking, and UI metadata.

## Agent Loop

The core loop should be explicit and inspectable.

1. **Receive prompt**
   - user asks for a feature, bug fix, UI, system, or mechanic
   - frontend sends prompt plus active Studio/runtime session id

2. **Gather context**
   - project tree
   - selected Studio objects
   - relevant scripts/modules
   - existing remotes/services/UI
   - package/dependency context
   - recent errors/logs

3. **Plan**
   - produce a short implementation plan
   - identify target instances/files
   - identify risks and assumptions

4. **Generate patch**
   - create/update scripts, folders, ModuleScripts, UI instances, RemoteEvents, attributes, and config
   - output structured operations, not loose prose

5. **Apply through runtime**
   - runtime translates operations into Rojo/Studio-compatible changes
   - snapshot is created before mutation
   - user can inspect changes

6. **Verify**
   - run a playtest or limited validation if available
   - capture output/errors
   - ask model for repair only when logs indicate a real issue

7. **Commit iteration**
   - store prompt, context summary, operations, model, logs, and snapshot id
   - expose rollback and retry

## Data Model

Start minimal.

- `users`
- `projects`
- `runtime_sessions`
- `studio_sessions`
- `threads`
- `messages`
- `prompt_iterations`
- `snapshots`
- `operations`
- `model_invocations`
- `api_keys`

Important snapshot fields:

- `id`
- `project_id`
- `runtime_session_id`
- `parent_snapshot_id`
- `created_by_iteration_id`
- `tree_hash_before`
- `tree_hash_after`
- `operation_count`
- `created_at`

Important operation fields:

- `kind`
- `target_path`
- `instance_ref`
- `before`
- `after`
- `status`
- `error`

## MVP

The MVP should be brutally focused.

### Milestone 1: Rojo Fork Runtime

- fork Rojo
- rename/package runtime internally
- build locally on macOS
- run Studio plugin connection
- expose a simple local HTTP API:
  - health
  - session status
  - current tree
  - apply script patch
  - rollback last patch

### Milestone 2: Grapeee Studio Plugin

- branded plugin button
- connect/disconnect UI
- status indicator
- selected object reporting
- output log streaming if feasible
- basic mutation support

### Milestone 3: Web App Control Surface

- auth
- connected runtime status
- prompt composer
- task stream
- generated operation preview
- apply/rollback buttons
- settings for Azure/OpenRouter provider

### Milestone 4: AI Patch Loop

- DeepSeek provider integration
- context gathering from runtime
- structured operation generation
- apply generated script/module/UI changes
- store prompt iterations

### Milestone 5: Acquisition Build

- public open-source repo cleanup
- one-command local runtime install
- plugin install guide
- demo video: "build a Roblox shop in 60 seconds"
- Discord launch
- Roblox devforum post
- comparison page: Grapeee vs Lemonade

## Deployment

Early deployment should be simple and boring.

Host on a small AWS instance first:

- `t4g.micro`
- Docker Compose
- nginx or Caddy
- Postgres
- backend container
- frontend container
- automatic restart policies
- healthchecks
- daily database backup

Do not create a fragile deployment maze. The first version should support:

```text
git pull
docker compose build
docker compose up -d
```

Later improvements:

- blue/green deploys
- managed Postgres
- object storage for logs/artifacts
- separate worker machine
- CDN for frontend

## Acquisition Strategy

The growth wedge should be direct and shamelessly practical.

Audience:

- Lemonade users who hit prompt limits
- Roblox beginners who want free/cheap AI help
- developers who distrust closed tools touching their game
- open-source Roblox toolchain users

Hooks:

- "Open-source Lemonade"
- "Bring your own AI key"
- "Unlimited prompts if you have a model key"
- "Rollback every AI change"
- "Built on Rojo"
- "Your game stays yours"

Launch assets:

- short demo clips
- comparison page
- setup guide
- plugin listing
- Discord
- GitHub README with a real GIF
- templates for common Roblox mechanics

First demo prompts:

- shop UI with coins
- sword combat tool
- pet hatching system
- simple simulator loop
- obby checkpoints
- farming plot system
- leaderboard/stat saving scaffold

## Risks

### Rojo Fork Complexity

Forking Rojo gives the right foundation, but it also adds Rust complexity and upstream merge responsibility.

Mitigation:

- keep the fork focused
- avoid broad rewrites
- add Grapeee-specific behavior at API/plugin boundaries first
- track upstream clearly

### Studio API Limits

Some Studio operations and properties may be awkward or impossible to sync live.

Mitigation:

- start with scripts, folders, remotes, and simple UI
- expose limitations honestly
- add model/file formats gradually

### Model Quality

Cheap/free inference can create broken Roblox code.

Mitigation:

- retrieve project context aggressively
- keep operations structured
- run validation/playtest loops
- support repair from logs
- build curated Roblox prompt/context packs

### Trust

An AI tool that mutates Studio projects can feel dangerous.

Mitigation:

- snapshot before every change
- rollback in one click
- operation preview
- open-source runtime
- clear local/cloud boundary

## Immediate Next Steps

1. Revert or keep the existing TypeScript prototype intentionally; do not let it drift.
2. Create a dedicated Rojo fork branch/repo.
3. Build upstream Rojo locally and document the build path.
4. Identify the smallest API surface needed for Grapeee Runtime.
5. Implement runtime health/session/tree endpoints.
6. Wire a minimal Studio plugin status panel.
7. Add Azure DeepSeek provider as the first model backend.
8. Build the web prompt screen around a real connected runtime.
9. Demo one generated script landing in Studio.
10. Add snapshot and rollback before expanding generation scope.

## Decision

Restart the project around a Rojo fork, not around the current app scaffold.

The current Next.js prototype can donate UI/auth ideas, but the durable core should be:

```text
Rojo fork runtime + Studio plugin + Python control plane + Next.js web UI + DeepSeek provider
```

That gives Grapeee the same kind of foundation Lemonade appears to have, while making the product cheaper, more transparent, and easier to trust.
