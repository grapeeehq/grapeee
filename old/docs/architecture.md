# Architecture

## Top-Level Design

Grapeee should start as a two-part system:

- a hosted or local web app for UI and orchestration
- a local runtime made of a daemon plus an optional Studio plugin

This avoids the biggest trap in a web-first product: pretending the browser can directly manage local development state.

## Components

### Web app

Responsibilities:

- authentication and session state
- chat interface
- plan and diff presentation
- onboarding and connection status
- task history

Suggested stack:

- `Next.js`
- `TypeScript`
- `Bun` for local installs and dev commands
- server actions or route handlers for lightweight orchestration
- `Better Auth` for authentication
- `Drizzle` for database access
- `Postgres` for persistence

### Local daemon

Responsibilities:

- discover local projects
- read and write project files after approval
- run project-aware scans
- expose safe wrappers around tools such as `Rojo`
- broker Studio plugin connectivity
- stream local state back to the web app

Suggested stack:

- `TypeScript`
- `Bun` for local development speed
- Node-compatible runtime assumptions for compatibility with the broader ecosystem
- long-lived local daemon with a small local HTTP or WebSocket server

### Studio plugin

Responsibilities:

- expose live Studio session presence
- surface selection, hierarchy, and inspectable instance state
- run Studio-only actions such as Luau execution and playtesting
- register one or more Studio sessions with the local daemon

Suggested stack:

- `Luau`
- plugin-side transport to the local daemon over local HTTP or WebSocket
- capability coverage modeled after Roblox Studio MCP, but exposed through Grapeee's own runtime contract

### Agent core

Responsibilities:

- model selection and routing
- tool calling policy
- prompt assembly
- task planning
- patch generation
- action safety checks

### Roblox context package

Responsibilities:

- parse `default.project.json` and related `Rojo` configs
- read `wally.toml` and lockfile data
- identify likely services and runtime boundaries
- build a compact context bundle for the model
- classify files by gameplay, UI, shared, server, and client concerns

### Knowledge system

Responsibilities:

- ingest curated Roblox ecosystem docs into compact plain-text chunks
- tag chunks with metadata such as tool, class, service, workflow, and topic
- retrieve a small set of high-signal chunks for a task
- support search-note generation before planning or editing
- avoid overexposing large example-heavy payloads to the model

### Shared types

Responsibilities:

- connection state messages
- project metadata
- diff payloads
- task records
- Studio MCP snapshots

## Data Flow

1. User sends a request from the web app
2. Web app asks the daemon for current project context
3. Daemon returns a compact snapshot of files, configs, status, and any connected Studio metadata
4. Agent core builds a prompt with:
   - user request
   - project context
   - optional Studio context
   - retrieved doc notes
   - safety instructions
5. Model produces a plan and proposed edits
6. UI renders the plan and diff
7. User approves
8. Companion applies changes locally

## Why Studio MCP Matters

Studio contains state that file-only tools can miss:

- live hierarchy state
- current selections
- object inspection
- details not reflected in source files yet

That makes Studio MCP a context source, not a replacement for local source files. Grapeee should merge both sources carefully and label them clearly in the UI.

## Model Routing

Use OpenRouter from the start so routing stays flexible.

Recommended strategy:

- use a stronger model for planning, architecture, and larger code edits
- use a cheaper faster model for summarization, classification, titles, and small transforms

The routing layer should be isolated in `packages/agent-core` so model changes do not leak into the product surface.

## Retrieval Strategy

The retrieval system should be intentionally narrow and opinionated.

Instead of generic RAG over arbitrary blobs, Grapeee should start with curated doc packs:

- Roblox docs in compact plain text
- `Rojo` references
- `Wally` references
- internal workflow guidance

Each chunk should be organized by concept rather than only by token length. Useful metadata includes:

- source
- topic
- class or service
- tool
- workflow step
- confidence or freshness markers when available

The agent should retrieve only a few strong results, summarize them into working notes, and then plan code changes using those notes plus project context.

## Search Loop

The search loop should be explicit in agent behavior:

1. detect unknowns
2. decide whether to search project files, Studio context, or doc packs
3. issue a small number of compact search intents
4. rank results
5. produce short working notes
6. continue to planning or patch generation

This is more valuable than simply giving the model a search tool, because it teaches retrieval judgment.

## Database And Auth

The backend should start simple:

- `Postgres` as the primary database
- `Drizzle` for schema and query management
- `Better Auth` for sessions, identities, and provider expansion later

This gives the project a portable core without depending on a platform-specific backend product.

## Runtime Strategy

Use `Bun` as the default local workflow for fast installs and script execution, but keep the backend and companion code Node-compatible.

That balance gives the team:

- faster local iteration
- easier deployment flexibility
- lower risk when integrating ecosystem packages around file watching, auth, MCP, and subprocess management

## Safety Rules

- default to read-only until the user approves writes
- classify commands by risk before execution
- show the exact files that will change
- prefer patches over wholesale rewrites
- store enough metadata to explain why a change was made

## Repo Layout

```text
grapeee/
  apps/
    web/
    companion/
  packages/
    agent-core/
    roblox-context/
    knowledge-system/
    shared-types/
  docs/
```

## First Vertical Slice

Build the smallest end-to-end feature that proves the product shape:

1. a user opens the web app
2. the daemon connects from the local machine
3. the daemon scans a Roblox project for `Rojo` and `Wally`
4. the Studio plugin optionally registers a live Studio session
5. the web app shows detected project metadata
6. the user asks for a simple change
7. the agent produces a plan and a mock diff

That slice proves the hardest product question early: whether the web-plus-local architecture feels smooth enough for real users.
