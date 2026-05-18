import type { ProjectContext, RetrievedChunk, WorkingNote } from "@grapeee/shared-types";

const DOC_PACK: RetrievedChunk[] = [
  {
    id: "roblox-context-boundaries",
    title: "Respect runtime boundaries",
    body: "Separate server, client, shared, and UI code. Prefer project-backed paths over assuming an Instance hierarchy from memory.",
    sourceName: "Grapeee Guardrails",
    sourceUrl: "internal://guardrails/runtime-boundaries",
    topic: "architecture",
    keywords: ["server", "client", "shared", "ui", "replicatedstorage", "structure"],
  },
  {
    id: "rojo-file-truth",
    title: "Rojo treats files as the source of truth",
    body: "When a Rojo project file exists, prefer creating or editing file-backed modules instead of assuming Studio-only objects. Keep new code aligned with the detected source tree.",
    sourceName: "Rojo Notes",
    sourceUrl: "https://rojo.space/docs/",
    topic: "rojo",
    toolName: "rojo",
    keywords: ["rojo", "project", "files", "sync", "default.project.json"],
  },
  {
    id: "wally-packages",
    title: "Wally packages should stay explicit",
    body: "If Wally is present, prefer note-taking and explicit dependency recommendations over silently inventing new packages. Reference package needs in working notes before changing package files.",
    sourceName: "Wally Notes",
    sourceUrl: "https://wally.run/",
    topic: "wally",
    toolName: "wally",
    keywords: ["wally", "package", "dependency", "manifest"],
  },
  {
    id: "search-before-code",
    title: "Search before patching",
    body: "If the task depends on unknown API behavior or tool conventions, create working notes first. Retrieve a few high-signal chunks, summarize them, then patch.",
    sourceName: "Grapeee Guardrails",
    sourceUrl: "internal://guardrails/search-before-code",
    topic: "search",
    keywords: ["search", "working notes", "retrieve", "summarize"],
  },
  {
    id: "module-scaffold",
    title: "Prefer small modules for first-pass changes",
    body: "For early scaffolds, add a focused module or service file in the best matching runtime directory. Make the patch easy to review and extend tomorrow.",
    sourceName: "Grapeee Guardrails",
    sourceUrl: "internal://guardrails/small-modules",
    topic: "patching",
    keywords: ["module", "scaffold", "service", "patch", "review"],
  },
];

export function retrieveKnowledge(input: {
  prompt: string;
  projectContext: ProjectContext;
  unknowns: string[];
}): { chunks: RetrievedChunk[]; workingNotes: WorkingNote[] } {
  const terms = tokenize([
    input.prompt,
    input.projectContext.detectedTools.join(" "),
    input.projectContext.serverPaths.join(" "),
    input.projectContext.clientPaths.join(" "),
    input.projectContext.sharedPaths.join(" "),
    input.unknowns.join(" "),
  ].join(" "));

  const ranked = DOC_PACK
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, terms, input.projectContext),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.chunk);

  return {
    chunks: ranked,
    workingNotes: ranked.map((chunk) => ({
      title: chunk.title,
      summary: chunk.body,
      impact: buildImpact(chunk),
      sourceIds: [chunk.id],
    })),
  };
}

function scoreChunk(chunk: RetrievedChunk, terms: string[], projectContext: ProjectContext) {
  let score = 0;
  const haystack = tokenize([
    chunk.title,
    chunk.body,
    chunk.topic,
    chunk.toolName ?? "",
    chunk.service ?? "",
    chunk.className ?? "",
    chunk.keywords.join(" "),
  ].join(" "));

  for (const term of terms) {
    if (haystack.includes(term)) {
      score += 3;
    }
  }

  if (chunk.toolName && projectContext.detectedTools.includes(chunk.toolName)) {
    score += 5;
  }

  if (chunk.topic === "search") {
    score += 1;
  }

  return score;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
}

function buildImpact(chunk: RetrievedChunk) {
  if (chunk.toolName === "rojo") {
    return "Keep the patch aligned with the file-backed project tree.";
  }

  if (chunk.toolName === "wally") {
    return "Call out dependency needs before editing package metadata.";
  }

  if (chunk.topic === "search") {
    return "Summarize what you learned before writing code.";
  }

  return "Keep the first patch focused and easy to review.";
}
