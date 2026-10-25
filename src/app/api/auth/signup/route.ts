import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { callAdminHook } from "@/lib/adminHook";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password, name, code } = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Notify admin panel about new signup (college credits, user tracking).
    // Fire-and-forget: don't block the response if admin is slow or down.
    const headersList = await headers();
    const country = headersList.get("x-vercel-ip-country") || undefined;
    callAdminHook("/api/hooks/signup", {
      email,
      name: name || undefined,
      verified: false,
      code: code || undefined,
      country,
      source: "direct",
      device: "web",
    }).catch(() => { /* already logged inside callAdminHook */ });

    return NextResponse.json({ success: true, message: "Account created successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
