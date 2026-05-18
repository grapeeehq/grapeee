# Companion

This app is the current seed for Grapeee's local daemon. It runs on the developer's machine and bridges the web UI to local Roblox development tools.

Initial responsibilities:

- discover local project state
- scan `Rojo` and `Wally` files
- broker connectivity to a future Grapeee Studio plugin
- apply approved patches
- expose a safe local API to the web app

## Managed pairing prototype

The daemon now includes a browser-based pairing flow so a local runtime can attach to the signed-in
web session without manual token copying.

### Local endpoints

- `POST /auth/start`
  - starts a pairing request with the web app
  - opens the browser by default
  - optionally waits for approval before returning
- `GET /auth/status`
  - returns the latest local runtime auth state

### Environment

- `GRAPEEE_WEB_URL`
  - base URL for the web app pairing endpoints
  - defaults to `http://localhost:3001`
- `GRAPEEE_PAIRING_WAIT_MS`
  - how long `POST /auth/start` waits for approval before returning a pending state
