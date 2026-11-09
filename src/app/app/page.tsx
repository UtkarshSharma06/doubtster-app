import type { Metadata } from "next";
import { ClientApp } from "./ClientApp";
import { createClient } from "@/utils/supabase/server";
import "@/styles/app.css";

export const metadata: Metadata = {
  title: "Doubtster app | ask, learn, watch",
  description: "Ask any question, get step by step answers, and turn them into videos, notes, flashcards and quizzes.",
};

export default async function Page() {
  let user: { id: string; email?: string; name?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const meta = (data.user.user_metadata || {}) as Record<string, string>;
      const fullName = meta.full_name || meta.name || meta.display_name || "";
      const firstName =
        meta.first_name ||
        (fullName ? fullName.split(" ")[0] : "") ||
        (data.user.email ? data.user.email.split("@")[0] : "");
      user = {
        id: data.user.id,
        email: data.user.email,
        name: firstName || fullName || data.user.email?.split("@")[0] || "",
      };
    }
  } catch (e) {
    // guest or dev fallback
  }

  return <ClientApp user={user} />;
}
