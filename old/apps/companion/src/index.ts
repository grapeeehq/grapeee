import { mkdir, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import path from "node:path";

import { scanRobloxProject, validateProjectRoot } from "@grapeee/roblox-context";
import type {
  ApplyPatchRequest,
  ApplyPatchResponse,
  ConnectProjectRequest,
  ConnectProjectResponse,
  ProjectContext,
  RuntimePairingStartRequest,
  RuntimePairingStartResponse,
  RuntimePairingStatusResponse,
  StudioStatus,
} from "@grapeee/shared-types";

const port = Number.parseInt(process.env.COMPANION_PORT ?? "8787", 10);
const webAppUrl = process.env.GRAPEEE_WEB_URL ?? "http://localhost:3001";
const pairingWaitTimeoutMs = Number.parseInt(process.env.GRAPEEE_PAIRING_WAIT_MS ?? "90000", 10);
let currentProjectContext: ProjectContext | null = null;
let currentRuntimeAuth: RuntimeAuthState = {
  state: "disconnected",
  webAppUrl,
};

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        version: "0.1.0",
        projectConnected: Boolean(currentProjectContext),
        runtimeConnected: currentRuntimeAuth.state === "connected",
      });
    }

    if (request.method === "GET" && url.pathname === "/auth/status") {
      if (currentRuntimeAuth.state === "pending" && currentRuntimeAuth.pairing) {
        try {
          const latest = await fetchRuntimePairingStatus(currentRuntimeAuth.pairing);
          currentRuntimeAuth = buildRuntimeAuthState({
            pairing: currentRuntimeAuth.pairing,
            status: latest,
          });
        } catch {
          // keep the last known state when the web app is temporarily unavailable
        }
      }

      return json(currentRuntimeAuth);
    }

    if (request.method === "POST" && url.pathname === "/auth/start") {
      const body = await request.json().catch(() => ({})) as RuntimePairingStartRequest & {
        openBrowser?: boolean;
        waitForSeconds?: number;
      };

      try {
        const pairing = await createRuntimePairing(body);
        const shouldOpenBrowser = body.openBrowser !== false;
        const browserOpened = shouldOpenBrowser
          ? await openExternalBrowser(pairing.verificationUrl)
          : false;
        const waitMs = typeof body.waitForSeconds === "number"
          ? Math.max(0, body.waitForSeconds) * 1000
          : pairingWaitTimeoutMs;
        const status = waitMs > 0
          ? await waitForRuntimePairing(pairing, waitMs)
          : buildPendingRuntimeStatus(pairing);

        currentRuntimeAuth = buildRuntimeAuthState({
          pairing,
          status,
          browserOpened,
        });

        return json(currentRuntimeAuth);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start runtime auth";
        return json({ error: message }, 502);
      }
    }

    if (request.method === "POST" && url.pathname === "/projects/connect") {
      const body = await request.json() as ConnectProjectRequest;

      if (!body.projectPath) {
        return json({ error: "projectPath is required." }, 400);
      }

      await validateProjectRoot(body.projectPath);
      currentProjectContext = await scanRobloxProject(body.projectPath);

      const payload: ConnectProjectResponse = {
        projectContext: currentProjectContext,
        studioStatus: buildStudioStatus(),
      };

      return json(payload);
    }

    if (request.method === "GET" && url.pathname === "/projects/current/context") {
      if (!currentProjectContext) {
        return json({ error: "No project is connected yet." }, 404);
      }

      return json({
        projectContext: currentProjectContext,
        studioStatus: buildStudioStatus(),
      } satisfies ConnectProjectResponse);
    }

    if (request.method === "GET" && url.pathname === "/studio/status") {
      return json(buildStudioStatus());
    }

    if (request.method === "POST" && url.pathname === "/patches/apply") {
      const body = await request.json() as ApplyPatchRequest;

      if (!body.projectRoot || !Array.isArray(body.patchFiles)) {
        return json({ error: "projectRoot and patchFiles are required." }, 400);
      }

      const writtenFiles: string[] = [];
      for (const file of body.patchFiles) {
        if (file.relativePath.includes("..")) {
          return json({ error: `Unsafe relative path: ${file.relativePath}` }, 400);
        }

        const absolutePath = path.join(body.projectRoot, file.relativePath);
        await mkdir(path.dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, file.content, "utf8");
        writtenFiles.push(file.relativePath);
      }

      const payload: ApplyPatchResponse = { writtenFiles };
      return json(payload);
    }

    return json({ error: "Not found." }, 404);
  },
});

console.log(`Grapeee companion listening on http://127.0.0.1:${server.port}`);

function buildStudioStatus(): StudioStatus {
  return {
    connected: false,
    mode: "disconnected",
    message: "Studio MCP is not wired into the prototype yet. The companion is exposing a placeholder read-only status.",
    selectionSummary: [],
  };
}

function buildPendingRuntimeStatus(
  pairing: RuntimePairingStartResponse,
): RuntimePairingStatusResponse {
  return {
    pairingId: pairing.pairingId,
    status: "pending",
    deviceName: pairing.deviceName,
    hostKind: pairing.hostKind,
    code: pairing.code,
    verificationUrl: pairing.verificationUrl,
    expiresAt: pairing.expiresAt,
  };
}

function buildRuntimeAuthState({
  pairing,
  status,
  browserOpened,
}: {
  pairing: RuntimePairingStartResponse;
  status: RuntimePairingStatusResponse;
  browserOpened?: boolean;
}): RuntimeAuthState {
  if (status.status === "authorized") {
    return {
      state: "connected",
      webAppUrl,
      browserOpened,
      pairing,
      session: status,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  return {
    state: status.status === "expired" ? "disconnected" : "pending",
    webAppUrl,
    browserOpened,
    pairing,
    session: status,
    lastCheckedAt: new Date().toISOString(),
  };
}

async function createRuntimePairing(input: RuntimePairingStartRequest) {
  const response = await fetch(`${webAppUrl}/api/runtime/pairing/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deviceName: input.deviceName?.trim() || `Grapeee daemon on ${hostname()}`,
      hostKind: input.hostKind ?? "daemon",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start pairing: ${response.status}`);
  }

  return await response.json() as RuntimePairingStartResponse;
}

async function fetchRuntimePairingStatus(pairing: RuntimePairingStartResponse) {
  const params = new URLSearchParams({
    pairingId: pairing.pairingId,
    pollToken: pairing.pollToken,
  });
  const response = await fetch(`${webAppUrl}/api/runtime/pairing/status?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to read pairing status: ${response.status}`);
  }

  return await response.json() as RuntimePairingStatusResponse;
}

async function waitForRuntimePairing(pairing: RuntimePairingStartResponse, waitMs: number) {
  const deadline = Date.now() + waitMs;
  let latestStatus = buildPendingRuntimeStatus(pairing);

  while (Date.now() < deadline) {
    latestStatus = await fetchRuntimePairingStatus(pairing);

    if (latestStatus.status !== "pending") {
      return latestStatus;
    }

    await Bun.sleep(pairing.intervalSeconds * 1000);
  }

  return latestStatus;
}

async function openExternalBrowser(targetUrl: string) {
  const command = process.platform === "darwin"
    ? ["open", targetUrl]
    : process.platform === "win32"
      ? ["cmd", "/c", "start", "", targetUrl]
      : ["xdg-open", targetUrl];

  try {
    const proc = Bun.spawn(command, {
      stdout: "ignore",
      stderr: "ignore",
    });

    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch {
    return false;
  }
}

function json(payload: unknown, status = 200) {
  return withCors(Response.json(payload, { status }));
}

function withCors(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

interface RuntimeAuthState {
  state: "disconnected" | "pending" | "connected";
  webAppUrl: string;
  browserOpened?: boolean;
  pairing?: RuntimePairingStartResponse;
  session?: RuntimePairingStatusResponse;
  lastCheckedAt?: string;
}
