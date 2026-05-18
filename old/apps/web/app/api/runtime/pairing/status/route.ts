import { NextResponse } from "next/server";

import { getRuntimePairingStatus } from "@/lib/runtime-pairing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pairingId = searchParams.get("pairingId");
  const pollToken = searchParams.get("pollToken");

  if (!pairingId || !pollToken) {
    return NextResponse.json({ error: "pairingId and pollToken are required" }, { status: 400 });
  }

  const status = getRuntimePairingStatus(pairingId, pollToken);
  if (!status) {
    return NextResponse.json({ error: "Pairing session not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
