// POST /api/explainer  { question, subject? }  ->  { id, status }
import { NextResponse } from "next/server";
import { engineFetch, type EngineJob } from "@/lib/doubtster-engine";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { question?: unknown; subject?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.slice(0, 40) : undefined;
  if (question.length < 3 || question.length > 2000) {
    return NextResponse.json({ error: "question must be 3 to 2000 characters" }, { status: 422 });
  }

  const r = await engineFetch("/v1/videos", {
    method: "POST",
    body: JSON.stringify({ question, subject, options: { resolution: "720p", captions: true } }),
  });
  const data = (await r.json().catch(() => ({}))) as Partial<EngineJob> & { detail?: string };
  if (!r.ok) {
    return NextResponse.json({ error: data.detail ?? "engine error" }, { status: r.status === 429 ? 429 : 502 });
  }
  return NextResponse.json({ id: data.id, status: data.status }, { status: 202 });
}
