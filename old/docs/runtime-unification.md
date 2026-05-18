# Runtime Unification

## Goal

Make the local daemon feel similar in usage to the Studio plugin by treating both as hosts for the same Grapeee runtime capabilities.

For the concrete responsibility split and Roblox Studio MCP parity target, see [Daemon And Studio Plugin Spec](./daemon-plugin-spec.md).

The plugin should behave like a Studio-first capability host:

- live hierarchy and selection inspection
- Studio execution hooks
- runtime object inspection

The daemon should behave like a filesystem-and-tooling capability host:

- local project discovery
- `Rojo` and `Wally` scans
- local file reads and writes
- subprocess wrappers for tools such as `rojo`

The web app and agent should not need to care which host provides a capability. They should ask for a capability, receive a result, and label the source.

## Current Mismatch

Right now the product shape mixes two different ideas:

- the docs model the companion as a standalone local service with its own API
- the workspace UI already frames the Studio plugin and CLI as parallel connection paths

That can drift into an awkward product where users must understand transport details before they can use Grapeee.

## Proposed Model

Define one runtime protocol with multiple hosts:

1. `studio-host`
   - implemented by the Studio plugin
   - exposes Studio and live-session capabilities
2. `local-host`
   - implemented by the daemon or CLI
   - exposes filesystem and local tool capabilities

The user experience should be:

- install the Studio plugin if you want live Studio context
- run the Grapeee daemon or CLI if you want local file and project access
- when both are running, Grapeee combines both sources into one task context

This keeps the setup legible while still making the two surfaces feel consistent.

## Capability-First API

Instead of modeling the daemon around custom endpoints such as:

- `POST /projects/connect`
- `GET /projects/current/context`
- `POST /patches/apply`

model both plugin and daemon around a shared RPC-like capability surface.

Example capability names:

- `project.getCurrent`
- `project.scan`
- `files.read`
- `files.writePatch`
- `tools.rojo.status`
- `studio.status`
- `studio.selection.get`
- `studio.tree.inspect`
- `studio.runCommand`

Each capability response should include:

- `host`: `studio-host` or `local-host`
- `capability`
- `mode`: `read-only` or `read-write`
- `payload`
- `observedAt`

This gives the agent a uniform way to request context and lets the UI clearly say what came from Studio versus the filesystem.

## Recommended Split

Keep the hard boundary on responsibility, not on product identity.

The Studio plugin should own:

- session presence inside Studio
- live selection and hierarchy state
- APIs that only exist inside Studio

The daemon should own:

- project root selection
- file scanning and indexing
- patch application
- local tool execution
- long-lived cache, auth token storage, and background sync

This means the plugin should not become a second filesystem mutator unless there is a very strong reason. The daemon remains the write authority for local files.

## Usage Parity

To make the daemon feel similar to the plugin in day-to-day use:

1. Give both the same connection lifecycle
   - `discover`
   - `connect`
   - `report capabilities`
   - `heartbeat`
   - `disconnect`
2. Give both the same status model
   - `offline`
   - `available`
   - `connected`
   - `degraded`
3. Give both the same command shape
   - request by capability name plus JSON input
   - return structured JSON output plus source metadata
4. Give both the same UI treatment
   - show one "Runtime" panel with capability badges instead of separate mental models

Users should feel like they are attaching two adapters to the same runtime, not learning two products.

## UX Recommendation

Prefer this framing in the UI:

- `Local runtime`
  - files
  - project scan
  - Rojo/Wally
- `Studio runtime`
  - live selection
  - hierarchy
  - Studio actions

Avoid making `plugin` and `CLI` the primary nouns in the core UX. Those are implementation details. The main user question is which capabilities are available right now.

## Data Model Recommendation

The current schema has `companion_connections` and booleans such as `pluginConnected` and `cliConnected`.

Longer term, replace this with a more general runtime connection model:

- `runtime_connections`
  - `host_type`: `local-host` or `studio-host`
  - `transport`: `daemon`, `cli`, or `plugin`
  - `status`
  - `capabilities`
  - `last_seen_at`
  - `project_id`

That gives room for future transports without changing the product model again.

## Agent Routing Rule

Teach the agent to choose a source by capability, not by transport:

1. If the task needs live Studio state, prefer a Studio capability.
2. If the task needs file truth, prefer the local host.
3. If both exist, merge them and label conflicts explicitly.
4. If one host is missing, degrade gracefully and say what is unavailable.

This aligns well with the existing product principle that Studio MCP is a context source, not a replacement for local files.

## Migration Path

### Phase 1

Keep the current daemon HTTP API, but wrap it internally with capability names and normalized responses.

### Phase 2

Define shared runtime contracts in `packages/shared-types` for:

- runtime host identity
- capability descriptors
- capability requests and responses
- heartbeat events

### Phase 3

Refactor the workspace UI to render a single runtime status model instead of `pluginConnected` and `cliConnected` booleans.

### Phase 4

Implement the Studio plugin as a second host that speaks the same capability protocol.

## Practical Bottom Line

If the goal is "make the daemon similar in usage to the plugin," the right move is not to force them into the same implementation.

The right move is:

- same capability protocol
- same connection lifecycle
- same status model
- same UI framing
- different responsibility boundaries

That gives you a product that feels unified to users while still respecting the fact that Studio and the local machine are different execution environments.
