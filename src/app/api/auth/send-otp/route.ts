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
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: type === "signup",
        data: {
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

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Check your inbox or spam folder.`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}
