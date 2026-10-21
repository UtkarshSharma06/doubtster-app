import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAppOrigin } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const supabase = await createClient();
    const origin = getAppOrigin(request);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/login`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Reset link sent" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
