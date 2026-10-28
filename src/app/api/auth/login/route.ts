import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkCollegeDomain } from "@/lib/collegeCheck";

export async function POST(request: Request) {
  try {
    const { email, password, isStudent = false } = await request.json();

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // If email is not confirmed, initiate OTP verification
      if (error.message.toLowerCase().includes("email not confirmed")) {
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        }).catch(() => {});

        return NextResponse.json(
          {
            requireOtp: true,
            email: cleanEmail,
            error: "Your email has not been verified yet. We sent a 6-digit verification code to your inbox.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Logged in successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
