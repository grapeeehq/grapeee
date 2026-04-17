import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { scanRobloxProject, validateProjectRoot } from "@grapeee/roblox-context";
import type {
  ApplyPatchRequest,
  ApplyPatchResponse,
  ConnectProjectRequest,
  ConnectProjectResponse,
  ProjectContext,
  StudioStatus,
} from "@grapeee/shared-types";

const port = Number.parseInt(process.env.COMPANION_PORT ?? "8787", 10);
let currentProjectContext: ProjectContext | null = null;

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
      });
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

function json(payload: unknown, status = 200) {
  return withCors(Response.json(payload, { status }));
}

function withCors(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
