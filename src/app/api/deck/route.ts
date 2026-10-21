import { NextResponse } from "next/server";
import { verifyPlanAccess } from "@/lib/planGuard";

/**
 * Deck API: Generates flashcard decks.
 * Requires active Doubtster Pro plan or trial. Only chat is free.
 */
export async function POST() {
  const planCheck = await verifyPlanAccess("Flashcards & Quizzes");
  if (!planCheck.allowed) {
    return NextResponse.json(
      {
        error: planCheck.error,
        requiresPlan: true,
        code: "PLAN_REQUIRED",
      },
      { status: planCheck.status }
    );
  }

  return NextResponse.json({ error: "Not implemented yet." }, { status: 501 });
}
