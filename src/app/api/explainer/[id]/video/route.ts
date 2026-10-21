// GET /api/explainer/:id/video  ->  streams the MP4 (supports Range so the player can seek)
import { engineFetch, JOB_ID } from "@/lib/doubtster-engine";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!JOB_ID.test(id)) return new Response("bad id", { status: 400 });
  const range = req.headers.get("range");
  const r = await engineFetch(`/v1/videos/${id}/file`, { headers: range ? { range } : {} });
  if (!r.ok && r.status !== 206) return new Response(await r.text(), { status: r.status });
  const headers = new Headers({ "content-type": "video/mp4", "cache-control": "private, max-age=3600" });
  for (const h of ["content-length", "content-range", "accept-ranges"]) {
    const v = r.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(r.body, { status: r.status, headers });
}
