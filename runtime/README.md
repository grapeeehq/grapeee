# Grapeee Runtime

This directory is the landing zone for the Rojo fork.

The target is not a clean-room sync engine. Grapeee should fork Rojo, preserve the mature Rust/Studio plugin foundation, and add a thin agent-facing API for Studio inspection, structured operations, snapshots, rollback, and logs.

## Intended Layout

```text
runtime/
  rojo/             # Rojo fork or submodule
  patches/          # Grapeee-specific patch notes while staying upstream-aware
  docs/             # runtime API notes
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
git submodule add git@github.com:grapeee/rojo.git runtime/rojo
```

Until then, use upstream locally for exploration:

```bash
git clone https://github.com/rojo-rbx/rojo.git runtime/rojo
```

