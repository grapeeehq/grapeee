import { NextResponse } from "next/server";

import { createTaskDraft } from "@grapeee/agent-core";
import type { TaskDraftRequest } from "@grapeee/shared-types";

export async function POST(request: Request) {
  const body = await request.json() as TaskDraftRequest;

  if (!body.prompt || !body.projectContext) {
    return NextResponse.json({ error: "prompt and projectContext are required." }, { status: 400 });
  }

  const draft = await createTaskDraft(body);
  return NextResponse.json({ draft });
}
