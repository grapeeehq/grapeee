import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";

const SYSTEM_PROMPT = [
  "You name Roblox game-dev chat threads based on the developer's first message.",
  "Output ONLY a 2–5 word title in Title Case. No quotes, no trailing punctuation, no explanation.",
  "If the user mentions a reference game (e.g. @Lumber Tycoon 2), let it inform the name but don't copy it verbatim.",
].join("\n");

function cleanTitle(raw: string): string {
  let text = raw;
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/^[\s"'`*_-]+|[\s"'`*_.!?]+$/g, "");
  text = text.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? text;
  text = text.replace(/^[\s"'`*_-]+|[\s"'`*_.!?]+$/g, "");
  if (text.length > 60) text = text.slice(0, 60).trim();
  return text || "New thread";
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Grapeee",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 32,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt.slice(0, 800) },
      ],
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `OpenRouter ${upstream.status}: ${text.slice(0, 300)}` },
      { status: 502 },
    );
  }

  const payload = await upstream.json();
  const raw = payload?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") {
    return NextResponse.json({ title: "New thread" });
  }

  return NextResponse.json({ title: cleanTitle(raw) });
}
