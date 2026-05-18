import { access, readdir } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";

import type { ProjectContext, ProjectWarning } from "@grapeee/shared-types";

const SOURCE_EXTENSIONS = new Set([".lua", ".luau"]);
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "out",
]);

const SERVER_HINTS = ["server", "serverscriptservice", "serverstorage"];
const CLIENT_HINTS = ["client", "starterplayer", "starterplayerscripts", "startergui", "starterpack"];
const SHARED_HINTS = ["shared", "replicatedstorage", "replicatedfirst", "common"];
const UI_HINTS = ["gui", "ui", "interface", "hud"];

export async function scanRobloxProject(projectRoot: string): Promise<ProjectContext> {
  const warnings: ProjectWarning[] = [];
  const files = await walk(projectRoot);

  const rojoConfigPath = preferFile(files, (file) => file.endsWith("default.project.json"))
    ?? preferFile(files, (file) => file.endsWith(".project.json"));
  const wallyManifestPath = preferFile(files, (file) => file.endsWith("wally.toml"));
  const lockfilePath = preferFile(files, (file) => file.endsWith("wally.lock"));

  const sourceFiles = files.filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)));
  const sourceDirectories = unique(
    sourceFiles.map((file) => normalizeRelative(projectRoot, path.dirname(file))).filter(Boolean),
  );

  const serverPaths = classify(sourceDirectories, SERVER_HINTS);
  const clientPaths = classify(sourceDirectories, CLIENT_HINTS);
  const sharedPaths = classify(sourceDirectories, SHARED_HINTS);
  const uiPaths = classify(sourceDirectories, UI_HINTS);

  if (!rojoConfigPath) {
    warnings.push({
      code: "missing_rojo",
      message: "No Rojo project file was detected. Grapeee works best when the project is file-backed.",
      severity: "warning",
    });
  }

  if (!wallyManifestPath) {
    warnings.push({
      code: "missing_wally",
      message: "No wally.toml was detected. Package-aware suggestions may be limited.",
      severity: "info",
    });
  }

  if (sourceFiles.length === 0) {
    warnings.push({
      code: "missing_source",
      message: "No .lua or .luau source files were found in the selected project root.",
      severity: "warning",
    });
  }

  const detectedTools = unique([
    rojoConfigPath ? "rojo" : "",
    wallyManifestPath ? "wally" : "",
    "studio-mcp",
  ].filter(Boolean));

  return {
    projectName: path.basename(projectRoot),
    projectRoot,
    rojoConfigPath: rojoConfigPath ? normalizeRelative(projectRoot, rojoConfigPath) : undefined,
    wallyManifestPath: wallyManifestPath ? normalizeRelative(projectRoot, wallyManifestPath) : undefined,
    lockfilePath: lockfilePath ? normalizeRelative(projectRoot, lockfilePath) : undefined,
    sourceFileCount: sourceFiles.length,
    sourceDirectories,
    detectedTools,
    serverPaths,
    clientPaths,
    sharedPaths,
    uiPaths,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

async function walk(root: string): Promise<string[]> {
  const output: string[] = [];
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    let entries: Dirent[];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          queue.push(absolutePath);
        }
        continue;
      }

      output.push(absolutePath);
    }
  }

  return output;
}

function classify(paths: string[], hints: string[]) {
  return paths.filter((candidate) => {
    const lower = candidate.toLowerCase();
    return hints.some((hint) => lower.includes(hint));
  });
}

function preferFile(files: string[], predicate: (file: string) => boolean) {
  return files.find(predicate);
}

function normalizeRelative(projectRoot: string, absolutePath: string) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export async function validateProjectRoot(projectRoot: string) {
  await access(projectRoot);
}
