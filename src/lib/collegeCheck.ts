import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qpsauvbbcpnzmocoacfw.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function emailDomain(e: string): string {
  const m = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(String(e || "").trim().toLowerCase());
  return m ? m[1] : "";
}

export interface CollegeMatch {
  id: string;
  name: string;
  domain: string;
  credits: number;
  active: boolean;
  country?: string;
}

export interface CollegeCheckResult {
  approved: boolean;
  domain: string;
  college?: CollegeMatch;
  message: string;
}

/**
 * Checks if an email address belongs to an approved active college domain.
 * Queries admin_colleges table in Supabase and merges with admin store.
 */
export async function checkCollegeDomain(email: string): Promise<CollegeCheckResult> {
  const dom = emailDomain(email);
  if (!dom) {
    return {
      approved: false,
      domain: "",
      message: "Please enter a valid university email address.",
    };
  }

  const allColleges: any[] = [];

  // 1. Fetch from Supabase admin_colleges
  try {
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: colleges, error } = await (sb.from("admin_colleges") as any)
      .select("*")
      .eq("active", true);

    if (!error && Array.isArray(colleges)) {
      for (const c of colleges) {
        allColleges.push(c);
      }
    }
  } catch (err: any) {
    console.warn("[collegeCheck] Supabase query notice:", err?.message);
  }

  // 2. Also check local doubtster-admin .data/admin.json store (dev/local sync)
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), "..", "doubtster-admin", ".data", "admin.json"),
      path.resolve(process.cwd(), ".data", "admin.json"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.colleges)) {
          for (const ac of parsed.colleges) {
            if (ac && ac.active !== false && !allColleges.some((c) => c.id === ac.id || c.domain === ac.domain)) {
              allColleges.push({
                id: ac.id,
                name: ac.name,
                domain: ac.domain,
                subdomains: ac.subdomains !== false,
                credits: Number(ac.credits ?? 10),
                active: true,
                country: ac.country,
              });
            }
          }
        }
      }
    }
  } catch {
    // Ignore filesystem fallback error
  }

  let match: any = null;
  for (const c of allColleges) {
    const allowSubdomains = c.subdomains !== false;
    const isMatch = dom === c.domain || (allowSubdomains && dom.endsWith("." + c.domain));
    if (isMatch && (!match || c.domain.length > match.domain.length)) {
      match = c;
    }
  }

  if (!match) {
    return {
      approved: false,
      domain: dom,
      message: "Doubtster is not in your college yet.",
    };
  }

  const credits = Number(match.credits ?? 10);
  return {
    approved: true,
    domain: dom,
    college: {
      id: match.id,
      name: match.name,
      domain: match.domain,
      credits,
      active: match.active !== false,
      country: match.country,
    },
    message: `Verified! Welcome ${match.name} student (+${credits} credits unlocked).`,
  };
}
