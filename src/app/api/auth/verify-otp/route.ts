import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkCollegeDomain } from "@/lib/collegeCheck";
import { callAdminHook } from "@/lib/adminHook";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, token, type = "email", isStudent = false, name = "", code = "" } = await request.json();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanToken = String(token || "").trim().replace(/\D/g, "");

    if (!cleanEmail || !cleanToken) {
      return NextResponse.json({ error: "Email and 6-digit verification code are required." }, { status: 400 });
    }

    if (cleanToken.length !== 6) {
      return NextResponse.json({ error: "Verification code must be 6 digits." }, { status: 400 });
    }

    const supabase = await createClient();

    // Try primary verification type first, then fallback
    let authRes = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: type === "signup" ? "signup" : "email",
    });

    if (authRes.error) {
      // Try alternative verification type if first attempt failed
      const altType = type === "signup" ? "email" : "signup";
      const retryRes = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: altType,
      });

      if (!retryRes.error) {
        authRes = retryRes;
      }
    }

    if (authRes.error) {
      return NextResponse.json(
        { error: authRes.error.message || "Invalid or expired verification code. Please request a new code." },
        { status: 400 }
      );
    }

    const user = authRes.data?.user;

    // If student, attach college metadata and register college signup
    let collegeMatch: any = null;
    if (isStudent) {
      const collegeRes = await checkCollegeDomain(cleanEmail);
      if (collegeRes.approved && collegeRes.college) {
        collegeMatch = collegeRes.college;
        if (user) {
          await supabase.auth.updateUser({
            data: {
              is_student: true,
              college_id: collegeMatch.id,
              college_name: collegeMatch.name,
              name: name || undefined,
            },
          });
        }
      }
    }

    // Notify admin panel about email verification and college grant
    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") || collegeMatch?.country || undefined;

    callAdminHook("/api/hooks/signup", {
      email: cleanEmail,
      name: name || undefined,
      verified: true,
      code: code || undefined,
      country,
      source: isStudent ? "college_signup" : "direct",
      device: "web",
    }).catch(() => {});

    callAdminHook("/api/hooks/email-verified", {
      email: cleanEmail,
      verified: true,
      collegeId: collegeMatch?.id,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Email successfully verified! Redirecting...",
      user,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify code. Please try again." }, { status: 500 });
  }
}
