import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  localPathHint: text("local_path_hint"),
  rojoConfigPath: text("rojo_config_path"),
  wallyManifestPath: text("wally_manifest_path"),
  status: varchar("status", { length: 32 }).notNull().default("connected"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectSnapshots = pgTable("project_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  sourceCount: text("source_count").notNull(),
  serverPaths: jsonb("server_paths").notNull(),
  clientPaths: jsonb("client_paths").notNull(),
  sharedPaths: jsonb("shared_paths").notNull(),
  detectedTools: jsonb("detected_tools").notNull(),
  warnings: jsonb("warnings").notNull(),
  studioConnected: boolean("studio_connected").notNull().default(false),
  snapshotJson: jsonb("snapshot_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  userId: text("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("queued"),
  userPrompt: text("user_prompt").notNull(),
  planSummary: text("plan_summary"),
  assumptions: jsonb("assumptions").notNull(),
  riskNotes: jsonb("risk_notes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskArtifacts = pgTable("task_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  artifactType: varchar("artifact_type", { length: 64 }).notNull(),
  contentJson: jsonb("content_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patchReviews = pgTable("patch_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  changedFiles: jsonb("changed_files").notNull(),
  diffText: text("diff_text").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  sourceType: varchar("source_type", { length: 64 }).notNull(),
  sourceUrl: text("source_url"),
  freshnessLabel: varchar("freshness_label", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  topic: varchar("topic", { length: 64 }).notNull(),
  service: varchar("service", { length: 120 }),
  className: varchar("class_name", { length: 120 }),
  toolName: varchar("tool_name", { length: 64 }),
  workflowStage: varchar("workflow_stage", { length: 64 }),
  keywords: jsonb("keywords").notNull(),
  metadataJson: jsonb("metadata_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const companionConnections = pgTable("companion_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  projectId: uuid("project_id"),
  deviceName: varchar("device_name", { length: 160 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("online"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
