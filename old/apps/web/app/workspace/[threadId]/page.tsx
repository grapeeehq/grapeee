"use client";

import { use } from "react";

import { ThreadPane } from "../workspace-shell";

export default function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  return <ThreadPane threadId={threadId} />;
}
