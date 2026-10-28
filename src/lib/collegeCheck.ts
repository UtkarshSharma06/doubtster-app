import { createClient } from "@supabase/supabase-js";

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
 * Queries admin_colleges table in Supabase.
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

  try {
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: colleges, error } = await (sb.from("admin_colleges") as any)
      .select("*")
      .eq("active", true);

    if (error || !colleges) {
      console.warn("[collegeCheck] Supabase query error:", error?.message);
      return {
        approved: false,
        domain: dom,
        message: "Could not verify college domain at this time. Please try again.",
      };
    }

    let match: any = null;
    for (const c of colleges) {
      const isMatch = dom === c.domain || (c.subdomains && dom.endsWith("." + c.domain));
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

    return {
      approved: true,
      domain: dom,
      college: {
        id: match.id,
        name: match.name,
        domain: match.domain,
        credits: Number(match.credits ?? 10),
        active: match.active !== false,
        country: match.country,
      },
      message: `Verified! Welcome ${match.name} student (+${match.credits || 10} credits unlocked).`,
    };
  } catch (err: any) {
    console.error("[collegeCheck] error:", err);
    return {
      approved: false,
      domain: dom,
      message: "Doubtster is not in your college yet.",
    };
  }
}
