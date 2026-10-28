import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { callAdminHook } from "@/lib/adminHook";
import { checkCollegeDomain } from "@/lib/collegeCheck";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password, name, code, isStudent = false } = await request.json();

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    let collegeMatch: any = null;
    if (isStudent) {
      const collegeRes = await checkCollegeDomain(cleanEmail);
      if (!collegeRes.approved) {
        return NextResponse.json(
          { error: collegeRes.message || "Doubtster is not in your college yet" },
          { status: 400 }
        );
      }
      collegeMatch = collegeRes.college;
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name || "",
          is_student: !!isStudent,
          college_id: collegeMatch?.id || "",
          college_name: collegeMatch?.name || "",
          college_credits: collegeMatch ? Number(collegeMatch.credits ?? 10) : 0,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") || collegeMatch?.country || undefined;

    callAdminHook("/api/hooks/signup", {
      email: cleanEmail,
      name: name || undefined,
      verified: !!data.session,
      code: code || undefined,
      country,
      source: isStudent ? "college_signup" : "direct",
      device: "web",
    }).catch(() => {});

    // If session is null, Supabase sent an email OTP/verification link
    const requireOtp = !data.session;

    return NextResponse.json(
      {
        success: true,
        requireOtp,
        email: cleanEmail,
        message: requireOtp
          ? `We sent a 6-digit verification code to ${cleanEmail}.`
          : "Account created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
