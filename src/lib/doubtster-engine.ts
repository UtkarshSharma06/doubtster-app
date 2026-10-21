// Server-only helper for talking to the Doubtster video engine.
// Never import this from a client component: it reads the engine key.

export const JOB_ID = /^[a-f0-9]{32}$/;

export type EngineJob = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  stage?: string;
  progress?: number;
  duration?: number;
  error?: string;
  warnings?: string[];
};

export async function engineFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = process.env.DOUBTSTER_ENGINE_URL || "http://127.0.0.1:8000";
  const key = process.env.DOUBTSTER_ENGINE_KEY || "doubtster-engine-secret-key-2026";

  if (!base || !key) {
    throw new Error("DOUBTSTER_ENGINE_URL and DOUBTSTER_ENGINE_KEY must be set");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return fetch(`${base.replace(/\/$/, "")}${path}`, { ...init, headers, cache: "no-store" });
}
