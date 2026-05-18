import path from "node:path";

import { retrieveKnowledge } from "@grapeee/knowledge-system";
import type {
  PatchFile,
  ProjectContext,
  RetrievedChunk,
  StudioStatus,
  TaskDraft,
  TaskDraftRequest,
} from "@grapeee/shared-types";

export async function createTaskDraft(input: TaskDraftRequest): Promise<TaskDraft> {
  const unknowns = inferUnknowns(input.prompt, input.projectContext);
  const retrieval = retrieveKnowledge({
    prompt: input.prompt,
    projectContext: input.projectContext,
    unknowns,
  });

  const openRouterDraft = await tryOpenRouterDraft({
    prompt: input.prompt,
    projectContext: input.projectContext,
    studioStatus: input.studioStatus,
    supportingChunks: retrieval.chunks,
  });

  if (openRouterDraft) {
    return openRouterDraft;
  }

  return buildFallbackDraft({
    prompt: input.prompt,
    projectContext: input.projectContext,
    studioStatus: input.studioStatus,
    supportingChunks: retrieval.chunks,
    workingNotes: retrieval.workingNotes,
  });
}

function inferUnknowns(prompt: string, projectContext: ProjectContext) {
  const unknowns: string[] = [];
  const lower = prompt.toLowerCase();

  if (lower.includes("remote") || lower.includes("network") || lower.includes("client")) {
    unknowns.push("server client split");
  }

  if (projectContext.detectedTools.includes("rojo")) {
    unknowns.push("rojo mapping");
  }

  if (projectContext.detectedTools.includes("wally")) {
    unknowns.push("wally package expectations");
  }

  unknowns.push("roblox runtime boundaries");
  return unknowns;
}

async function tryOpenRouterDraft(input: {
  prompt: string;
  projectContext: ProjectContext;
  studioStatus?: StudioStatus;
  supportingChunks: RetrievedChunk[];
}) {
  const modelProvider = getModelProvider();

  if (!modelProvider) {
    return null;
  }

  const system = [
    "You are Grapeee, a Roblox-native coding copilot.",
    "Return strict JSON only.",
    "Prefer small, reviewable file-backed patches.",
    "Do not invent packages silently.",
    "Schema:",
    JSON.stringify({
      title: "string",
      summary: "string",
      assumptions: ["string"],
      risks: ["string"],
      plan: ["string"],
      workingNotes: [{ title: "string", summary: "string", impact: "string", sourceIds: ["string"] }],
      patchFiles: [{ operation: "create", relativePath: "string", content: "string", reason: "string" }],
    }),
  ].join("\n");

  const user = JSON.stringify({
    prompt: input.prompt,
    projectContext: input.projectContext,
    studioStatus: input.studioStatus,
    supportingChunks: input.supportingChunks,
  });

  try {
    const payload = await requestChatCompletion({
      provider: modelProvider,
      temperature: 0.3,
      maxTokens: 2400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return null;
    }

    const parsed = JSON.parse(stripJsonFence(content));
    const patchFiles = Array.isArray(parsed.patchFiles) ? parsed.patchFiles as PatchFile[] : [];
    return {
      title: parsed.title ?? "Roblox change draft",
      summary: parsed.summary ?? "Generated via OpenRouter.",
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      plan: Array.isArray(parsed.plan) ? parsed.plan : [],
      workingNotes: Array.isArray(parsed.workingNotes) ? parsed.workingNotes : [],
      supportingChunks: input.supportingChunks,
      patchFiles,
      diffText: buildDiffText(patchFiles),
      modelLabel: modelProvider.model,
    } satisfies TaskDraft;
  } catch {
    return null;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ModelProviderConfig {
  kind: "azure-openai-compatible" | "openrouter";
  url: string;
  apiKey: string;
  model: string;
  reasoningEffort?: string;
}

export function getConfiguredModelLabel() {
  return getModelProvider()?.model ?? "fallback planner";
}

export async function createChatTextStream(input: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}) {
  const provider = getModelProvider();
  if (!provider) {
    throw new Error("No model provider configured. Set AZURE_API_KEY or OPENROUTER_API_KEY.");
  }

  const response = await fetch(provider.url, {
    method: "POST",
    headers: buildProviderHeaders(provider),
    body: JSON.stringify(buildProviderBody({
      provider,
      messages: input.messages,
      stream: true,
      temperature: input.temperature ?? 0.6,
      maxTokens: input.maxTokens ?? 4096,
    })),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(`${provider.kind} ${response.status}: ${text.slice(0, 400)}`);
  }

  return response.body;
}

async function requestChatCompletion(input: {
  provider: ModelProviderConfig;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
}) {
  const response = await fetch(input.provider.url, {
    method: "POST",
    headers: buildProviderHeaders(input.provider),
    body: JSON.stringify(buildProviderBody({
      provider: input.provider,
      messages: input.messages,
      stream: false,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    })),
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

function getModelProvider(): ModelProviderConfig | null {
  const azureApiKey = process.env.AZURE_API_KEY;
  if (azureApiKey) {
    return {
      kind: "azure-openai-compatible",
      url: process.env.AZURE_OPENAI_CHAT_COMPLETIONS_URL
        ?? "https://cipher-azure.openai.azure.com/openai/v1/chat/completions",
      apiKey: azureApiKey,
      model: process.env.AZURE_OPENAI_MODEL ?? "DeepSeek-V4-Pro",
      reasoningEffort: process.env.AZURE_REASONING_EFFORT ?? "high",
    };
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    return {
      kind: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterApiKey,
      model: process.env.OPENROUTER_MODEL ?? "minimax/minimax-m2.5",
    };
  }

  return null;
}

function buildProviderHeaders(provider: ModelProviderConfig) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  };

  if (provider.kind === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    headers["X-Title"] = "Grapeee";
  }

  return headers;
}

function buildProviderBody(input: {
  provider: ModelProviderConfig;
  messages: ChatMessage[];
  stream: boolean;
  temperature: number;
  maxTokens: number;
}) {
  const body: Record<string, unknown> = {
    model: input.provider.model,
    stream: input.stream,
    temperature: input.temperature,
    messages: input.messages,
  };

  if (input.provider.kind === "azure-openai-compatible") {
    body.max_tokens = input.maxTokens;
    body.top_p = Number.parseFloat(process.env.AZURE_TOP_P ?? "0.1");
    if (input.provider.reasoningEffort) {
      body.reasoning_effort = input.provider.reasoningEffort;
    }
  } else {
    body.max_completion_tokens = input.maxTokens;
  }

  return body;
}

function stripJsonFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function buildFallbackDraft(input: {
  prompt: string;
  projectContext: ProjectContext;
  studioStatus?: StudioStatus;
  supportingChunks: RetrievedChunk[];
  workingNotes: TaskDraft["workingNotes"];
}): TaskDraft {
  const patchFiles = buildPatchFiles(input.prompt, input.projectContext);

  return {
    title: buildTitle(input.prompt),
    summary: `Prepared a focused first-pass Roblox scaffold for "${input.prompt.trim()}".`,
    assumptions: [
      "The first pass should create new files rather than rewriting existing systems.",
      input.projectContext.detectedTools.includes("rojo")
        ? "The project prefers file-backed changes that will sync through Rojo."
        : "No Rojo config was detected, so the patch stays conservative.",
      input.studioStatus?.connected
        ? "Studio state may still add details before final implementation."
        : "Studio MCP is not connected, so runtime hierarchy assumptions stay minimal.",
    ],
    risks: [
      "The generated patch is a scaffold and will likely need project-specific wiring.",
      "If the target project uses naming conventions not visible from the file tree, those should be aligned before merging.",
    ],
    plan: [
      "Choose the best runtime directory based on the detected Roblox project structure.",
      "Create a small, reviewable scaffold instead of a broad rewrite.",
      "Use the patch review step to decide whether the scaffold should be expanded into existing systems.",
    ],
    workingNotes: input.workingNotes,
    supportingChunks: input.supportingChunks,
    patchFiles,
    diffText: buildDiffText(patchFiles),
    modelLabel: "fallback planner",
  };
}

function buildPatchFiles(prompt: string, projectContext: ProjectContext): PatchFile[] {
  const lower = prompt.toLowerCase();
  const featureName = toPascalCase(prompt);

  if (lower.includes("remote") || lower.includes("client") || lower.includes("server")) {
    const sharedDir = pickDirectory(projectContext.sharedPaths, "src/shared/Grapeee");
    const serverDir = pickDirectory(projectContext.serverPaths, "src/server/Grapeee");
    const clientDir = pickDirectory(projectContext.clientPaths, "src/client/Grapeee");

    return [
      {
        operation: "create",
        relativePath: posixJoin(sharedDir, `${featureName}Shared.luau`),
        reason: "Shared constants keep the first pass explicit across runtime boundaries.",
        content: buildSharedContent(featureName),
      },
      {
        operation: "create",
        relativePath: posixJoin(serverDir, `${featureName}Service.luau`),
        reason: "Server-owned behavior stays isolated in a dedicated service scaffold.",
        content: buildServerContent(featureName, prompt),
      },
      {
        operation: "create",
        relativePath: posixJoin(clientDir, `${featureName}Controller.luau`),
        reason: "Client-facing glue is kept separate from server logic.",
        content: buildClientContent(featureName),
      },
    ];
  }

  const targetDirectory = pickDirectory(
    projectContext.sharedPaths.length > 0 ? projectContext.sharedPaths : projectContext.serverPaths,
    "src/shared/Grapeee",
  );

  return [
    {
      operation: "create",
      relativePath: posixJoin(targetDirectory, `${featureName}.luau`),
      reason: "A focused module is the safest first pass for a new Roblox feature.",
      content: buildModuleContent(featureName, prompt),
    },
  ];
}

function buildModuleContent(featureName: string, prompt: string) {
  return [
    `local ${featureName} = {}`,
    "",
    `function ${featureName}.describe()`,
    `\treturn ${JSON.stringify(`Scaffold generated for: ${prompt.trim()}`)}`,
    "end",
    "",
    `function ${featureName}.create()`,
    "\tlocal state = {",
    "\t\tenabled = true,",
    "\t}",
    "",
    "\treturn state",
    "end",
    "",
    `return ${featureName}`,
    "",
  ].join("\n");
}

function buildSharedContent(featureName: string) {
  return [
    `local ${featureName}Shared = {}`,
    "",
    `${featureName}Shared.RemoteName = ${JSON.stringify(`${featureName}Remote`)}`,
    "",
    `return ${featureName}Shared`,
    "",
  ].join("\n");
}

function buildServerContent(featureName: string, prompt: string) {
  return [
    `local ${featureName}Service = {}`,
    "",
    `function ${featureName}Service.start()`,
    `\tprint(${JSON.stringify(`${featureName}Service scaffold for ${prompt.trim()}`)})`,
    "end",
    "",
    `return ${featureName}Service`,
    "",
  ].join("\n");
}

function buildClientContent(featureName: string) {
  return [
    `local ${featureName}Controller = {}`,
    "",
    `function ${featureName}Controller.start()`,
    "\treturn true",
    "end",
    "",
    `return ${featureName}Controller`,
    "",
  ].join("\n");
}

function buildDiffText(patchFiles: PatchFile[]) {
  return patchFiles
    .map((file) => {
      const lines = file.content.split("\n");
      return [
        `diff --git a/${file.relativePath} b/${file.relativePath}`,
        "new file mode 100644",
        "--- /dev/null",
        `+++ b/${file.relativePath}`,
        `@@ -0,0 +1,${lines.length} @@`,
        ...lines.map((line) => `+${line}`),
      ].join("\n");
    })
    .join("\n\n");
}

function buildTitle(prompt: string) {
  return `${toPascalCase(prompt)} Scaffold`;
}

function toPascalCase(value: string) {
  const words = value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);

  if (words.length === 0) {
    return "GeneratedFeature";
  }

  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

function pickDirectory(candidates: string[], fallback: string) {
  const candidate = candidates[0];
  return candidate ? candidate.replace(/\/+$/, "") : fallback;
}

function posixJoin(...parts: string[]) {
  return path.posix.join(...parts.map((part) => part.split(path.sep).join("/")));
}
