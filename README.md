# Grapeee

Grapeee is an open-source, Roblox-native AI copilot for developers who want the speed of vibe coding without giving up maintainability, ownership, or the real Roblox toolchain.

The product direction is intentionally different from generic "build my game for me" agents:

- It works with `Rojo`, `Wally`, local source files, and Roblox Studio instead of hiding them.
- It treats AI as a careful collaborator that proposes and applies reviewed changes.
- It is designed for both new developers and experienced Roblox teams.

## Product Shape

The first version should be a web app backed by a local companion process:

- `apps/web`: browser UI for chat, diffs, tasks, project status, and onboarding
- `apps/companion`: local service that can read the repo, talk to `Rojo`, and connect to Roblox Studio MCP
- `packages/agent-core`: agent orchestration, tool routing, and task planning
- `packages/roblox-context`: Roblox-aware project analysis for `Rojo`, `Wally`, services, scripts, and packages
- `packages/shared-types`: shared contracts between the web app and local companion

This split matters because a web app alone cannot safely or directly access local project files or a running Studio session.

## MVP

The MVP should do a small number of things very well:

1. Connect a local Roblox project that uses `Rojo`
2. Detect project structure, packages, and common Roblox conventions
3. Connect to a running Roblox Studio session through MCP
4. Let the user request a task in plain English
5. Produce a plan and patch before making changes
6. Apply file changes locally and guide the sync loop back into Studio

## Core Principles

- Open source first
- Roblox-native instead of generic
- Diffs over magic
- Maintainable output over flashy demos
- Human approval for risky actions

## Initial Model Strategy

Start with OpenRouter so the product can route by task:

- Higher-quality planner/codegen model for more complex tasks
- Lower-cost fast model for summaries, filenames, labels, and lightweight edits

The long-term moat should come from Roblox-aware tooling and context, not loyalty to a single model vendor.

## Technical Defaults

The initial implementation should optimize for speed of iteration:

- `Next.js` + `TypeScript` for the web app
- `TypeScript` for the local companion
- `Bun` for installs, scripts, and local development speed
- Node-compatible code in core services so deployment and fallback stay easy
- `Postgres` as the primary database
- `Better Auth` for authentication
- `Drizzle` for schema management and queries

This keeps the stack modern and fast without making the product depend on Bun-only runtime features too early.

## Knowledge System

Grapeee should not rely on generic RAG alone. The product should include a Roblox-focused knowledge system that combines:

- curated plain-text doc packs
- search guidance for the agent
- local project context
- optional Studio MCP context

The goal is not to stuff the model with examples. The goal is to teach it how to retrieve the right information, summarize it into working notes, and then make changes that fit the actual project.

## Documents

- [Product spec](./docs/product-spec.md)
- [Architecture](./docs/architecture.md)
- [First build](./docs/first-build.md)
- [Knowledge system spec](./docs/knowledge-system-spec.md)
- [Data model](./docs/data-model.md)

## Status

This repository currently contains the v1 foundation docs and workspace scaffold. The next implementation milestone is a thin vertical slice:

1. local companion boot
2. web app onboarding flow
3. project scan for `default.project.json` and `wally.toml`
4. one read-only Studio MCP action
5. one patch proposal shown in the UI

The current docs also define the first-pass UX, the knowledge system, and the initial database shape so implementation can start without reopening the whole product debate.

## Local Testing

You can run the prototype locally in two pieces:

1. Start the local companion on the host machine:
   - `bun run dev:companion`
2. Start Postgres and the web app with Docker:
   - `bun run docker:up`

The web app will be available at `http://localhost:3001`, Postgres will be exposed on `localhost:5434`, and the browser will still be able to reach the companion at `http://127.0.0.1:8787`.
