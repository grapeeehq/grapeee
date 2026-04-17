export type ProjectWarningSeverity = "info" | "warning" | "error";

export interface ProjectWarning {
  code: string;
  message: string;
  severity: ProjectWarningSeverity;
}

export interface ProjectContext {
  projectName: string;
  projectRoot: string;
  rojoConfigPath?: string;
  wallyManifestPath?: string;
  lockfilePath?: string;
  sourceFileCount: number;
  sourceDirectories: string[];
  detectedTools: string[];
  serverPaths: string[];
  clientPaths: string[];
  sharedPaths: string[];
  uiPaths: string[];
  warnings: ProjectWarning[];
  generatedAt: string;
}

export interface StudioStatus {
  connected: boolean;
  mode: "disconnected" | "read-only" | "connected";
  message: string;
  selectionSummary: string[];
  lastSyncAt?: string;
}

export interface ConnectProjectRequest {
  projectPath: string;
}

export interface ConnectProjectResponse {
  projectContext: ProjectContext;
  studioStatus: StudioStatus;
}

export interface PatchFile {
  operation: "create" | "update";
  relativePath: string;
  content: string;
  reason: string;
}

export interface WorkingNote {
  title: string;
  summary: string;
  impact: string;
  sourceIds: string[];
}

export interface RetrievedChunk {
  id: string;
  title: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  toolName?: string;
  service?: string;
  className?: string;
  keywords: string[];
}

export interface TaskDraft {
  title: string;
  summary: string;
  assumptions: string[];
  risks: string[];
  plan: string[];
  workingNotes: WorkingNote[];
  supportingChunks: RetrievedChunk[];
  patchFiles: PatchFile[];
  diffText: string;
  modelLabel: string;
}

export interface TaskDraftRequest {
  prompt: string;
  projectContext: ProjectContext;
  studioStatus?: StudioStatus;
}

export interface TaskDraftResponse {
  draft: TaskDraft;
}

export interface ApplyPatchRequest {
  projectRoot: string;
  patchFiles: PatchFile[];
}

export interface ApplyPatchResponse {
  writtenFiles: string[];
}
