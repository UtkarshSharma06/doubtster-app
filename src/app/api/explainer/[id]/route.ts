// GET /api/explainer/:id  ->  job status
import { NextResponse } from "next/server";
import { engineFetch, JOB_ID } from "@/lib/doubtster-engine";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!JOB_ID.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const r = await engineFetch(`/v1/videos/${id}`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.ok ? 200 : r.status });
}
