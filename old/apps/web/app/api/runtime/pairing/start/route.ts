import { NextResponse } from "next/server";

import { createRuntimePairing } from "@/lib/runtime-pairing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pairing = createRuntimePairing(body);
  return NextResponse.json(pairing);
}
