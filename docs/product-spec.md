# Product Spec

## One-Sentence Pitch

Grapeee is an open-source AI coding copilot for Roblox that understands the real Roblox workflow, including `Rojo`, `Wally`, local source files, and Roblox Studio.

## Problem

Most general AI coding tools fail on Roblox development because they do not understand the working environment that real Roblox developers use:

- source-of-truth files managed outside Studio
- `Rojo` project mappings
- `Wally` packages and lockfiles
- client/server boundaries
- Studio-only context that still matters during development

That creates a bad tradeoff:

- beginner-facing tools can produce exciting demos but messy projects
- general coding tools can write Lua but miss Roblox-specific structure
- experienced developers still have to manually bridge the gap

## Product Goal

Build the fastest way to go from idea to maintainable Roblox implementation without disconnecting users from the actual development stack.

## Target Users

### 1. New Roblox developers

They want help turning ideas into working features, but they also need the tool to teach the real workflow rather than trap them in a closed system.

### 2. Experienced Roblox developers

They want acceleration on repetitive work, boilerplate, refactors, UI glue, and system scaffolding without sacrificing project quality.

## Product Principles

- Open-source by default
- Show plans and diffs before important changes
- Respect existing project structure
- Prefer compatibility with current Roblox workflows over inventing a parallel one
- Teach the user what changed and why

## Product Wedge

The wedge is not "the smartest model."

The wedge is a Roblox-native agent runtime with strong context:

- project-aware file scanning
- `Rojo` tree understanding
- `Wally` dependency awareness
- Studio-style inspection and execution hooks exposed by a Grapeee Studio plugin
- safe change planning with explicit patch review

## Technical Direction

The first version should favor the fastest full-stack development path over premature systems optimization.

- `Next.js` + `TypeScript` for the web app
- `TypeScript` for the daemon service and shared logic
- `Luau` for the Studio plugin
- `Bun` as the default package manager and local dev runner
- Node-compatible implementation in the backend and daemon for maximum library compatibility
- `Postgres` as the system-of-record database
- `Better Auth` for authentication
- `Drizzle` for migrations and typed database access

Rust can still become a later optimization path for the daemon if native packaging, long-running daemon stability, or performance constraints justify it.

## Knowledge And Retrieval Direction

Grapeee should include a Roblox-native knowledge layer because generic agents consistently fail in three areas:

- they overfit to explicit examples
- they search poorly
- they lack compact, trustworthy context for Roblox-specific workflows

The product should not frame this as open-ended generic RAG. It should frame it as a controlled knowledge system built for Roblox development.

### Principles

- prefer compact plain-text references over heavy raw documentation dumps
- prefer principles and contrasts over copyable example templates
- retrieve a few highly relevant chunks instead of many weak matches
- combine retrieved docs with project context before generating code
- make the agent summarize findings into working notes before editing files

### Initial Knowledge Sources

- curated Roblox docs relevant to scripting and common services
- `Rojo` docs
- `Wally` docs
- internal Roblox workflow notes and guardrails
- later, selected project-local docs or team conventions

### Search Behavior Requirements

The agent should be explicitly taught how to search. A useful loop is:

1. identify what is unknown
2. choose the right source:
   - project files
   - Studio MCP state
   - doc packs
   - package or workflow docs
3. generate a small number of search intents
4. retrieve compact results
5. rank and summarize findings
6. use those notes when planning or patching

This should reduce hallucinated workflows and lower the tendency to anchor too hard on the first example-like result.

## MVP Scope

### In scope

- Web app chat interface
- Local daemon process
- Project import from an existing local folder
- Detection of `Rojo` project files and `Wally` config
- File-based context index for scripts, modules, packages, and services
- Grapeee Studio plugin with read-focused Studio capabilities
- Task planning and diff generation
- Local patch apply after approval
- compact doc pack retrieval for Roblox, `Rojo`, and `Wally`
- agent search notes derived from retrieval before code generation

### Out of scope

- full cloud execution of local Roblox tooling
- multi-user collaboration
- autonomous long-running agents
- direct publishing to Roblox as a first milestone
- replacing Studio or `Rojo`
- broad internet-scale crawling or arbitrary user-defined RAG pipelines

## Primary User Flows

## Flow 1: Connect a project

1. User opens the web app
2. User installs or launches the local daemon
3. Daemon registers a local project with the web app session
4. Grapeee scans for `Rojo`, `Wally`, and source layout
5. UI shows project health, detected packages, and connection state

## Flow 2: Ask for a change

1. User asks for a gameplay, UI, or systems task
2. Agent gathers file context and optional Studio context
3. Agent returns:
   - a short plan
   - affected files
   - risks or assumptions
   - a proposed patch
4. User approves or requests refinement
5. Daemon applies the patch locally

## Flow 3: Use Studio context

1. User connects a running Roblox Studio session
2. Agent inspects relevant tree state through MCP
3. UI shows what came from local files versus Studio context
4. Agent uses that context to reduce hallucinations about services, hierarchy, and live objects

## UX Requirements

- The agent must clearly separate:
  - what it inferred from local files
  - what it read from Studio
  - what it is assuming
- The product should default to proposing diffs, not silent writes
- Errors should be actionable and Roblox-specific
- The UI should make the local daemon and optional Studio plugin feel normal, not scary

## Trust Requirements

- No hidden file edits
- No destructive actions without confirmation
- Clear audit trail for prompts, plans, and patches
- Easy recovery when a generation is wrong

## Pricing Direction

The marketing can invite beginners, but the product should not promise fully automatic game creation. A better message:

"Build Roblox games faster with an AI copilot that understands your actual workflow."

That keeps the promise ambitious without implying one-click replacement of real development.

## Success Metrics

- time from project connect to first accepted patch
- percentage of tasks that result in an approved patch
- number of tasks completed without manual file hunting
- retained usage on existing projects, not just greenfield experiments

## V1 Milestones

1. Project import and scan
2. Read-focused Studio plugin connection
3. Chat plus context panel
4. Patch proposal and approval flow
5. Basic model routing through OpenRouter
6. Postgres-backed task and session persistence
7. Better Auth integration for project ownership and login
8. Roblox doc pack ingestion and retrieval
9. Search-note generation before patch planning
