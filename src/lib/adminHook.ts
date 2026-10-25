/**
 * Helper to call doubtster-admin webhook hooks from the app.
 * Uses HOOK_SECRET as a Bearer token for server-to-server auth.
 */

const ADMIN_URL = process.env.ADMIN_URL || "";
const HOOK_SECRET = process.env.HOOK_SECRET || "";

/**
 * Call an admin webhook hook.
 * @param path  e.g. "/api/hooks/signup"
 * @param body  JSON body
 * @returns parsed JSON response, or null on failure
 */
export async function callAdminHook<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<T | null> {
  if (!ADMIN_URL || !HOOK_SECRET) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[adminHook] ADMIN_URL or HOOK_SECRET not set – skipping hook call to",
        path
      );
    }
    return null;
  }

  try {
    const res = await fetch(`${ADMIN_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HOOK_SECRET}`,
      },
      body: JSON.stringify(body),
      // Don't block the response to the user
      // signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error("[adminHook] Hook failed", path, res.status, await res.text().catch(() => ""));
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error("[adminHook] Hook error", path, err);
    return null;
  }
}
