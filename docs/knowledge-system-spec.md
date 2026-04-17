# Knowledge System Spec

## Goal

The knowledge system should help the agent retrieve the right Roblox-specific information without turning the model into a copy machine for examples.

The system should favor:

- compact references
- strong metadata
- search behavior
- working-note synthesis

## Non-Goals

- arbitrary website crawling
- giant vector dumps with weak filtering
- user-uploaded enterprise knowledge bases in v1
- showing the model large example libraries by default

## Source Types

The first source set should be small and curated:

- Roblox scripting and API references
- Roblox workflow notes for common patterns
- `Rojo` docs
- `Wally` docs
- internal guardrails and search hints

## Document Preparation

Every source should be normalized into plain text with minimal noise.

Cleanup rules:

- strip navigation and marketing copy
- remove repetitive boilerplate
- preserve headings
- preserve short code samples only when they are necessary for understanding
- keep source URL and freshness metadata

## Chunking Strategy

Chunk by concept, not just token count.

Good chunk boundaries:

- one API concept
- one workflow step
- one tool command group
- one caution or constraint set

Avoid:

- mixing multiple unrelated services in one chunk
- giant copy-pasted pages
- example-heavy chunks that drown out the actual rule

## Chunk Schema

Each chunk should store:

- `id`
- `source_type`
- `source_name`
- `source_url`
- `title`
- `body`
- `topic`
- `service`
- `class_name`
- `tool_name`
- `workflow_stage`
- `keywords`
- `freshness_label`

Not every field must be present, but the schema should make retrieval filterable.

## Retrieval Inputs

The retrieval system should accept:

- user task text
- project summary
- detected tools such as `Rojo` or `Wally`
- optional Studio state summary
- unknowns extracted by the agent

## Retrieval Strategy

The first pass can be hybrid and simple:

1. metadata filters
2. keyword search
3. optional embedding ranking later
4. final small rerank pass

The most important behavior is reducing the candidate set before the model sees it.

## Search Loop

The agent should follow this search loop:

1. identify unknowns
2. choose source type
3. generate 2 to 4 search intents
4. retrieve small results
5. score relevance
6. write working notes
7. continue to planning

Example unknown types:

- "What service should hold this?"
- "How does `Rojo` map this source path?"
- "Is there a `Wally` package convention here?"
- "Is this a server, client, or shared concern?"

## Working Notes Format

The model should not receive raw chunks alone. It should first produce working notes.

Working notes should include:

- what was looked up
- what sources were used
- the key facts
- open uncertainties
- how the facts affect the patch plan

This step reduces blind copying and creates a more auditable reasoning trail.

## Search Behavior Guardrails

- prefer project files before external docs when the answer is project-specific
- prefer Studio MCP before docs when the question is about live hierarchy state
- avoid using a single chunk as final truth when multiple sources disagree
- prefer principles over examples when both are available
- avoid copying code examples unless the task clearly calls for the same structure

## Retrieval Output Contract

The retrieval layer should return:

- top chunks
- source metadata
- a short synthesized note block
- unresolved questions

This output should be small enough to fit comfortably into the planning prompt.

## Quality Signals

The system should track:

- retrieval hit rate for accepted patches
- number of tasks completed without follow-up clarification
- tasks where retrieved notes were ignored and patch quality dropped
- common missing topics that should become new doc packs

## First Build Implementation Notes

For the first build, the knowledge system can start with:

- flat files or Postgres-backed chunk storage
- metadata tagging at ingest time
- keyword-first retrieval
- handwritten internal notes for Roblox-specific guardrails

Embeddings and heavier ranking can come later once the basic flow works.
