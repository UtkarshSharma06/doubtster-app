import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkCollegeDomain } from "@/lib/collegeCheck";

export async function POST(request: Request) {
  try {
    const { email, type = "signup", isStudent = false } = await request.json();

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (isStudent) {
      const collegeRes = await checkCollegeDomain(cleanEmail);
      if (!collegeRes.approved) {
        return NextResponse.json(
          { error: collegeRes.message || "Doubtster is not in your college yet" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: type === "signup",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Check your inbox or spam folder.`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}
