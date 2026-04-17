# Data Model

## Goal

The initial data model should support:

- users and auth
- project connections
- chat tasks
- patch review artifacts
- knowledge chunks

It should stay small enough to implement quickly in `Postgres` with `Drizzle`.

## Core Entities

## users

Purpose:

- account ownership
- future billing ownership
- project ownership

Core fields:

- `id`
- `email`
- `name`
- `created_at`
- `updated_at`

## sessions

Purpose:

- auth session tracking

This will largely follow what `Better Auth` expects.

## projects

Purpose:

- represent a local Roblox project known to the system

Core fields:

- `id`
- `user_id`
- `name`
- `local_path_hint`
- `rojo_config_path`
- `wally_manifest_path`
- `status`
- `created_at`
- `updated_at`

## project_snapshots

Purpose:

- store the agent-visible project summary over time

Core fields:

- `id`
- `project_id`
- `source_count`
- `server_paths`
- `client_paths`
- `shared_paths`
- `detected_tools`
- `warnings`
- `studio_connected`
- `snapshot_json`
- `created_at`

## tasks

Purpose:

- one user request for analysis, planning, or a patch

Core fields:

- `id`
- `project_id`
- `user_id`
- `title`
- `status`
- `user_prompt`
- `plan_summary`
- `assumptions`
- `risk_notes`
- `created_at`
- `updated_at`

## task_messages

Purpose:

- persist the chat thread around a task

Core fields:

- `id`
- `task_id`
- `role`
- `content`
- `created_at`

## task_artifacts

Purpose:

- persist derived outputs attached to a task

Artifact examples:

- project summary
- working notes
- patch draft
- diff preview

Core fields:

- `id`
- `task_id`
- `artifact_type`
- `content_json`
- `created_at`

## patch_reviews

Purpose:

- track whether a generated patch was approved

Core fields:

- `id`
- `task_id`
- `status`
- `changed_files`
- `diff_text`
- `applied_at`
- `created_at`

## knowledge_sources

Purpose:

- identify a doc pack or imported source

Core fields:

- `id`
- `name`
- `source_type`
- `source_url`
- `freshness_label`
- `created_at`
- `updated_at`

## knowledge_chunks

Purpose:

- store retrieval units for doc packs

Core fields:

- `id`
- `source_id`
- `title`
- `body`
- `topic`
- `service`
- `class_name`
- `tool_name`
- `workflow_stage`
- `keywords`
- `metadata_json`
- `created_at`

## companion_connections

Purpose:

- keep track of active local companion sessions

Core fields:

- `id`
- `user_id`
- `project_id`
- `device_name`
- `status`
- `last_seen_at`
- `created_at`

## Suggested Status Enums

### projects.status

- `connected`
- `warning`
- `disconnected`

### tasks.status

- `queued`
- `planning`
- `awaiting_review`
- `approved`
- `rejected`
- `failed`

### patch_reviews.status

- `draft`
- `approved`
- `rejected`
- `applied`

### companion_connections.status

- `online`
- `offline`
- `stale`

## First-Pass Relationships

- one `user` has many `projects`
- one `project` has many `project_snapshots`
- one `project` has many `tasks`
- one `task` has many `task_messages`
- one `task` has many `task_artifacts`
- one `task` has zero or one `patch_review`
- one `knowledge_source` has many `knowledge_chunks`

## Deliberate Simplifications

- no organizations in v1
- no multiple collaborators per project in v1
- one active patch review per task
- knowledge chunks stored in the app database first

## Migration Order

The first migration pass should create:

1. auth tables
2. projects
3. project snapshots
4. tasks
5. task messages
6. task artifacts
7. patch reviews
8. knowledge sources
9. knowledge chunks
10. companion connections
