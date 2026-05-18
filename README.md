# Grapeee

Grapeee is an open-source Roblox Studio agent built on a Rojo-derived runtime.

The goal is direct and practical: type a Roblox feature, let Grapeee inspect the active Studio project, generate structured changes, sync them into Studio, test or inspect the result, and rollback any prompt iteration that misses.

## Product Shape

```text
Next.js web app
  -> FastAPI control plane
    -> Grapeee Runtime, forked from Rojo
      -> Roblox Studio plugin
```

The old prototype has been moved to `old/`.

## Local Development

```bash
bun install
python3.13 -m venv .venv
. .venv/bin/activate
pip install -e "apps/api[dev]"
```

Run the web app:

```bash
bun run dev:web
```

Run the API:

```bash
bun run dev:api
```

Run the full Docker stack:

```bash
docker compose up --build
```

## Environment

Copy `.env.example` to `.env` and set:

- `AZURE_API_KEY`
- `AZURE_OPENAI_CHAT_COMPLETIONS_URL`
- `AZURE_OPENAI_MODEL`
- `DATABASE_URL`
- `RESEND_API_KEY`
