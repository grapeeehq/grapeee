# First Build

## Goal

The first build should prove that Grapeee feels like a real Roblox-native copilot instead of a generic AI wrapper.

It does not need to generate production-ready games. It needs to prove the core loop:

1. connect a local Roblox project
2. understand the project structure
3. retrieve relevant Roblox workflow knowledge
4. produce a grounded plan
5. show a patch before applying changes

## Product Slice

The first slice should be intentionally small:

- one web app
- one local daemon
- one Studio plugin build target
- one connected local project
- one connected Studio session in read-only mode
- one chat thread
- one patch review flow

## User Story

"As a Roblox developer, I want to connect my existing project and ask for a change in plain English, then review a grounded patch that understands `Rojo`, `Wally`, and Studio context."

## Core Screens

## 1. Landing

Purpose:

- explain what Grapeee is
- set expectations around web app plus local daemon
- drive the user into connection flow

Primary content:

- concise product pitch
- "Connect your project" primary action
- short explanation of `Rojo`, `Wally`, and Studio support

## 2. Project Connection

Purpose:

- attach the current browser session to a local daemon
- confirm a project path
- show whether the project looks like a Roblox project

Primary states:

- daemon not installed
- daemon running but no project selected
- project connected
- project connected with warnings

## 3. Project Overview

Purpose:

- show the agent's understanding of the project before the user asks for work

Primary panels:

- detected `Rojo` config
- detected `Wally` manifest
- source directories
- server, client, shared classification
- Studio MCP connection state
- project warnings and assumptions

## 4. Chat Workspace

Purpose:

- let the user request work
- show planning before editing
- separate context sources clearly

Primary panels:

- conversation thread
- project context summary
- retrieved doc notes
- assumptions and risks

## 5. Patch Review

Purpose:

- make the generated work auditable and safe

Primary panels:

- changed files list
- unified diff
- generated plan summary
- "why this change" notes
- approve or reject controls

## UX Rules

- Always label what came from local files.
- Always label what came from Studio.
- Always label what came from retrieved docs.
- Never apply writes without user approval.
- Show warnings when the agent is uncertain about project structure.

## First Supported Task Types

The first build should support only a few categories:

- add or update a module script
- scaffold a server/client communication pattern
- create a simple gameplay feature stub
- refactor code into a cleaner Roblox-aware structure

The first build should not promise:

- full UI generation
- game-wide autonomous rewrites
- direct publishing to Roblox

## Daemon Responsibilities

- expose daemon status
- select a project root
- scan for `default.project.json`, `*.project.json`, `wally.toml`, and lockfiles
- index Lua or Luau source files
- report a compact project snapshot
- apply approved patches
- broker plugin status and Studio-derived context

## Studio Plugin Responsibilities

- expose Studio session status
- expose read-only hierarchy and selection probes
- expose script read and search operations
- expose controlled Studio execution and playtest hooks in later phases

## Web App Responsibilities

- authenticate user
- manage project session
- render chat, notes, and diffs
- request context from the companion
- call the agent runtime
- persist tasks and artifacts

## First End-To-End Flow

1. User opens Grapeee
2. User signs in
3. User launches the daemon
4. User selects a local project
5. Daemon scans and returns project metadata
6. User connects the Studio plugin
7. UI shows detected context and any warnings
8. User asks for a simple change
9. Agent requests project context and doc notes
10. Agent returns:
   - task summary
   - working notes
   - assumptions
   - plan
   - patch draft
11. User reviews the patch
12. User approves
13. Daemon applies the patch locally

## API Surface For The First Build

The backend API should stay small:

- `POST /api/session/connect-companion`
- `GET /api/projects/:id/context`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/approve`

The daemon should expose a small local API:

- `GET /health`
- `POST /projects/connect`
- `GET /projects/current/context`
- `POST /patches/apply`

The Studio plugin should expose a small local runtime surface to the daemon:

- `studio.status.get`
- `studio.selection.get`
- `studio.tree.search`
- `studio.instance.inspect`
- `studio.script.read`
- `studio.script.search`
- `studio.script.grep`

## First Build Acceptance Criteria

- a developer can connect one local Roblox project
- the project scan identifies `Rojo` and `Wally` when present
- the system can generate a project summary from local files
- the system can retrieve relevant notes from doc packs
- the UI can show a task plan and a patch draft
- the user can approve a patch and have it written locally

## Deliberate Shortcuts

These are good shortcuts for the first pass:

- one active project per session
- one chat thread per project
- no team features
- no background agents
- read-only Studio integration
- simple keyword plus metadata retrieval before adding heavier ranking

## What We Learn From This Build

- whether users trust the daemon-plus-plugin model
- whether project scanning is good enough to ground the agent
- whether doc notes reduce hallucinations
- whether patch review feels better than direct generation
- whether the web-plus-local split feels natural enough to keep
