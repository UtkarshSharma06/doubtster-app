"use client";

import { useEffect, useRef, useState } from "react";

type Job = { id: string; status: "queued" | "running" | "done" | "failed"; stage?: string; progress?: number; error?: string };

const STAGE: Record<string, string> = {
  queued: "In the queue",
  planning: "Writing the lesson",
  voicing: "Recording the voice-over",
  rendering: "Drawing the board",
  done: "Ready",
};

export default function ExplainerVideo({ initialQuestion = "" }: { initialQuestion?: string }) {
  const [question, setQuestion] = useState(initialQuestion);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function poll(id: string) {
    try {
      const r = await fetch(`/api/explainer/${id}`, { cache: "no-store" });
      const j: Job = await r.json();
      setJob(j);
      if (j.status === "failed") setError(j.error ?? "Something went wrong");
      if (j.status === "queued" || j.status === "running") timer.current = setTimeout(() => poll(id), 2500);
    } catch {
      timer.current = setTimeout(() => poll(id), 4000);
    }
  }

  async function start() {
    setError(null);
    setJob(null);
    const r = await fetch("/api/explainer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await r.json();
    if (!r.ok) return setError(data.error ?? "Could not start the video");
    setJob({ id: data.id, status: "queued", progress: 0 });
    poll(data.id);
  }

  const busy = job?.status === "queued" || job?.status === "running";
  const pct = Math.round((job?.progress ?? 0) * 100);

  return (
    <div style={{ maxWidth: 820, display: "grid", gap: 12 }}>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask any question..."
        rows={3}
        style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 }}
      />
      <button
        onClick={start}
        disabled={busy || question.trim().length < 3}
        style={{ padding: "12px 18px", borderRadius: 12, background: "#2F7BFF", color: "#fff", fontWeight: 700, border: 0 }}
      >
        {busy ? "Making your video..." : "Make video"}
      </button>

      {busy && (
        <div aria-live="polite">
          <div style={{ fontSize: 14, marginBottom: 6 }}>{STAGE[job?.stage ?? "queued"] ?? "Working"} · {pct}%</div>
          <div style={{ height: 8, borderRadius: 4, background: "#eee" }}>
            <div style={{ width: `${pct}%`, height: 8, borderRadius: 4, background: "#2F7BFF", transition: "width .4s" }} />
          </div>
        </div>
      )}

      {job?.status === "done" && (
        <video src={`/api/explainer/${job.id}/video`} controls playsInline style={{ width: "100%", borderRadius: 16 }} />
      )}
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
    </div>
  );
}
