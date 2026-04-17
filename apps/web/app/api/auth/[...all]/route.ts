import { NextResponse } from "next/server";

import { authHandlers, isAuthConfigured } from "@/lib/auth";

export async function GET(request: Request) {
  if (!isAuthConfigured || !authHandlers) {
    return NextResponse.json({ error: "Better Auth is not configured." }, { status: 503 });
  }

  return authHandlers.GET(request);
}

export async function POST(request: Request) {
  if (!isAuthConfigured || !authHandlers) {
    return NextResponse.json({ error: "Better Auth is not configured." }, { status: 503 });
  }

  return authHandlers.POST(request);
}
