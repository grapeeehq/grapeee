# Daemon And Studio Plugin Spec

## Why This Spec Exists

The repo currently mixes three different ideas:

- a local companion or daemon that owns file access
- a future Grapeee Studio plugin
- Roblox's official Studio MCP server

Those are related, but they are not the same thing.

This document defines the correct split for Grapeee.

## External Platform Facts

As of April 18, 2026:

- Roblox Studio includes a built-in Studio MCP server.
- Roblox documents it as a local `stdio` MCP server that can connect to one or more open Studio instances.
- The current official tool surface is broader than the older open-source reference server.
- Roblox's older `studio-rust-mcp-server` reference implementation was archived on April 3, 2026 and is no longer the active product path.

That means Grapeee should spec against the built-in Studio MCP capability shape, not against the legacy Rust transport architecture.

## Product Decision

Grapeee should have two local runtime components:

1. `daemon`
   - the local machine control plane
   - owns filesystem and local tool access
2. `studio-plugin`
   - the Studio-side runtime host
   - owns live Studio state and Studio actions

The web app should treat these as two capability providers inside one Grapeee runtime.

## Naming

Use `daemon` as the product and architecture term.

The existing `apps/companion` package can keep its current folder name temporarily, but the docs should stop treating "companion" as the long-term product noun. "Daemon" is clearer because this process is long-lived, local, and responsible for brokering runtime work.

## Core Rule

The daemon is the only local file write authority.

The Studio plugin is not a second local filesystem mutator. It can create or modify Studio objects and scripts inside an open Studio session, but it should not be treated as the source-of-truth file writer for a Rojo-backed project.

That boundary keeps Grapeee aligned with the real Roblox workflow:

- Studio is the live runtime and scene context
- files on disk remain the source of truth for Rojo-backed code

## What We Replicate From Studio MCP

The Grapeee Studio plugin should mirror most of the capability categories exposed by Roblox Studio MCP.

### Capability families to mirror

- script read and targeted edit
- script search and grep
- game tree exploration
- instance inspection
- Luau execution
- playtest control
- console log retrieval
- multi-Studio session discovery and active-session selection
- optional asset or content insertion flows
- optional player input simulation flows

### Official Studio MCP tool mapping

The built-in Studio MCP server currently exposes tools in these groups:

- Scripts:
  - `script_read`
  - `multi_edit`
  - `script_search`
  - `script_grep`
- Asset and content generation:
  - `generate_mesh`
  - `generate_material`
  - `insert_from_creator_store`
- Data model exploration:
  - `search_game_tree`
  - `inspect_instance`
- Luau execution:
  - `execute_luau`
- Playtesting:
  - `start_stop_play`
  - `console_output`
- Player input simulation:
  - `character_navigation`
  - `keyboard_input`
  - `mouse_input`
- Session management:
  - `list_roblox_studios`
  - `set_active_studio`

Grapeee does not need to copy the exact public tool names, but it should support equivalent capability coverage.

## Grapeee Runtime Shape

The runtime should look like this:

```text
web app / backend
        |
        v
     daemon
      /   \
     /     \
 local fs   studio-plugin
  + tools      inside Studio
```

The daemon is the broker and aggregator.

The Studio plugin should not talk directly to the hosted backend as its primary path. It should register to the local daemon, and the daemon should present a unified runtime surface upward to the web app and agent layer.

## Daemon Responsibilities

The daemon owns everything tied to the local machine and repository.

### Required responsibilities

- discover local projects
- let the user select or switch a project root
- validate project root safety
- scan `default.project.json`, `*.project.json`, `wally.toml`, and lockfiles
- index `.lua` and `.luau` files
- classify server, client, shared, and UI paths
- read local files for context
- apply approved patches to disk
- expose safe wrappers for local tooling such as `rojo`
- maintain daemon-to-web session identity
- broker requests to any connected Studio plugin
- merge file context and Studio context into one task context
- cache recent scans and Studio snapshots
- surface capability and health state to the UI

### Explicit non-responsibilities

- pretending to be the Studio-side hierarchy authority
- directly embedding all Studio logic into the daemon
- making unaudited writes without approval
- becoming a generic third-party MCP host for arbitrary tools in v1

## Studio Plugin Responsibilities

The plugin owns everything that only exists inside an active Studio session.

### Required responsibilities

- advertise that a Studio session is available
- register itself with the local daemon
- report Studio identity and session metadata
- expose the active selection
- expose flat and targeted hierarchy search
- inspect instances and readable properties
- read and edit scripts inside Studio
- execute Luau snippets with structured results
- start and stop playtest modes
- return console output and playtest logs
- list all open Studio sessions
- switch the active Studio session used for subsequent requests

### Optional but desirable responsibilities

- insert Creator Store assets and models
- generate materials or meshes when Roblox APIs permit it
- simulate input for automated testing flows
- capture light runtime diagnostics or test summaries

### Explicit non-responsibilities

- choosing the project root
- scanning disk for Rojo or Wally
- writing patch files to disk
- storing long-lived auth state
- being the primary backend connection

## Capability Contract

Both the daemon and the Studio plugin should implement the same runtime contract shape.

### Request shape

- `id`
- `targetHost`
- `capability`
- `input`
- `mode`
- `projectId`
- `studioSessionId`

### Response shape

- `id`
- `host`
- `capability`
- `ok`
- `payload`
- `error`
- `observedAt`
- `sourceLabel`

### Host types

- `daemon`
- `studio-plugin`

### Modes

- `read-only`
- `execute`
- `write`

## Recommended Capability Names

Use Grapeee-native names and map them internally to Studio or local implementations.

### Daemon-owned capabilities

- `project.list`
- `project.connect`
- `project.scan`
- `project.context.get`
- `files.read`
- `files.readMany`
- `files.writePatch`
- `files.stat`
- `tools.rojo.status`
- `tools.rojo.sourcemap`
- `tools.wally.status`
- `runtime.hosts.list`

### Studio-plugin-owned capabilities

- `studio.sessions.list`
- `studio.sessions.setActive`
- `studio.status.get`
- `studio.selection.get`
- `studio.tree.search`
- `studio.instance.inspect`
- `studio.script.read`
- `studio.script.search`
- `studio.script.grep`
- `studio.script.multiEdit`
- `studio.luau.execute`
- `studio.playtest.startStop`
- `studio.console.read`
- `studio.asset.insert`
- `studio.asset.generateMaterial`
- `studio.asset.generateMesh`
- `studio.input.keyboard`
- `studio.input.mouse`
- `studio.input.characterNavigate`

## Mapping To Roblox's Official MCP

These are the intended parity mappings:

- `script_read` -> `studio.script.read`
- `multi_edit` -> `studio.script.multiEdit`
- `script_search` -> `studio.script.search`
- `script_grep` -> `studio.script.grep`
- `search_game_tree` -> `studio.tree.search`
- `inspect_instance` -> `studio.instance.inspect`
- `execute_luau` -> `studio.luau.execute`
- `start_stop_play` -> `studio.playtest.startStop`
- `console_output` -> `studio.console.read`
- `list_roblox_studios` -> `studio.sessions.list`
- `set_active_studio` -> `studio.sessions.setActive`
- `insert_from_creator_store` -> `studio.asset.insert`
- `generate_material` -> `studio.asset.generateMaterial`
- `generate_mesh` -> `studio.asset.generateMesh`
- `character_navigation` -> `studio.input.characterNavigate`
- `keyboard_input` -> `studio.input.keyboard`
- `mouse_input` -> `studio.input.mouse`

## Connection Model

The daemon should be the only component the web app treats as a stable local runtime endpoint.

### Browser to daemon

- local HTTP for bootstrapping and health is fine in the first pass
- WebSocket is preferred for long-lived status and streamed task events

### Plugin to daemon

- local WebSocket is preferred
- localhost HTTP polling is acceptable only as a short-term bootstrap path
- every plugin connection should have:
  - ephemeral session ID
  - Studio window ID
  - place or experience name
  - active project hint if known
  - capability list

### Why the plugin should register to the daemon

- one stable local endpoint for the web app
- one place for auth and trust prompts
- one broker for multiple Studio windows
- one source of merged context for the agent

## Multi-Studio Support

The plugin layer must support multiple open Studio windows.

The daemon should maintain:

- all known Studio sessions
- one active Studio session per thread or task
- a fallback selection rule when only one Studio window is connected

This follows Roblox's own direction: their built-in Studio MCP supports listing multiple Studio instances and selecting an active one.

## Safety Model

The plugin and daemon should not share the same default permission level.

### Daemon defaults

- read-only until the user explicitly approves file writes
- patch application always goes through a review object
- local command wrappers remain allowlisted

### Plugin defaults

- hierarchy inspection and script reads are allowed once connected
- script edits, Luau execution, playtest control, asset insertion, and input simulation require explicit capability grants
- input simulation should be disabled by default in the first public release

### Audit requirements

Every write or execute action should record:

- requested capability
- caller thread or task ID
- active project
- active Studio session
- exact input payload
- timestamp
- result

## Source Of Truth Rules

When file state and Studio state disagree:

1. Treat disk as source of truth for Rojo-backed code and assets.
2. Treat Studio as source of truth for live selection, runtime hierarchy, and unsaved Studio-only objects.
3. Show the distinction clearly in the UI.
4. Do not silently sync Studio script edits back to disk in v1.

If the user wants Grapeee to make a code change for a Rojo-backed project, the preferred path is:

1. read Studio for context
2. plan against file truth
3. write patch to disk through the daemon
4. let Rojo or the user's sync workflow propagate the change back into Studio

## What The Daemon Must Not Do

To correct the current repo assumptions, the daemon must not be specified as:

- the thing that directly "is" Studio MCP
- the owner of live selection state
- the place where Studio-specific capability logic primarily lives

It can broker Studio requests, cache Studio data, and expose unified status, but the Studio-side runtime belongs in the plugin.

## What The Plugin Must Not Do

To avoid creating a second broken authority path, the plugin must not be specified as:

- the primary filesystem writer for Rojo projects
- the place that discovers repos on disk
- the direct replacement for the daemon

## Suggested Rollout

### Phase 1: Correct local architecture

- keep the current daemon prototype
- remove the assumption that the daemon itself owns Studio capabilities
- add runtime host and capability contracts in shared types

### Phase 2: Read-focused Studio plugin

- session registration
- Studio status
- active selection
- tree search
- instance inspect
- script read
- script search and grep

### Phase 3: Controlled execution

- multi-edit
- Luau execute
- playtest control
- console output

### Phase 4: Advanced Studio actions

- asset insertion
- material or mesh generation
- input simulation
- richer diagnostics

## MVP Recommendation

For Grapeee's first real plugin release, target this subset:

- `studio.sessions.list`
- `studio.sessions.setActive`
- `studio.status.get`
- `studio.selection.get`
- `studio.tree.search`
- `studio.instance.inspect`
- `studio.script.read`
- `studio.script.search`
- `studio.script.grep`
- `studio.script.multiEdit`
- `studio.luau.execute`
- `studio.playtest.startStop`
- `studio.console.read`

That covers most of the high-value Studio MCP workflow for coding, inspection, and testing without making asset generation or input simulation a day-one dependency.

## Data Model Direction

The current `companion_connections` table and UI booleans such as `pluginConnected` and `cliConnected` are too transport-shaped.

Move toward:

- `runtime_connections`
  - `host_type`
  - `transport`
  - `status`
  - `capabilities`
  - `project_id`
  - `studio_session_id`
  - `last_seen_at`

This matches the actual architecture better.

## References

- Roblox Creator Hub: Studio MCP docs
  - `https://create.roblox.com/docs/studio/mcp`
- Roblox archived reference server
  - `https://github.com/Roblox/studio-rust-mcp-server`
