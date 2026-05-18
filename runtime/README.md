# Grapeee Runtime

This directory contains Grapeee Runtime API notes. The Rojo fork itself lives in `plugin/rojo`.

The target is not a clean-room sync engine. Grapeee should fork Rojo, preserve the mature Rust/Studio plugin foundation, and add a thin agent-facing API for Studio inspection, structured operations, snapshots, rollback, and logs.

## Intended Layout

```text
runtime/
  patches/          # Grapeee-specific patch notes while staying upstream-aware
  docs/             # runtime API notes
plugin/
  rojo/             # Rojo fork submodule
```

## First Runtime API

- `GET /health`
- `GET /sessions/current`
- `GET /studio/tree`
- `POST /operations/apply`
- `POST /snapshots`
- `POST /snapshots/{id}/rollback`
- `GET /logs/stream`

## Fork Command

Once the GitHub fork exists:

```bash
git submodule add https://github.com/grapeeehq/rojo.git plugin/rojo
```

Until then, use upstream locally for exploration:

```bash
git clone https://github.com/grapeeehq/rojo.git plugin/rojo
```
