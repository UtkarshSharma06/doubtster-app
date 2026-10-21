import type { Metadata } from "next";
import { ClientApp } from "./ClientApp";
import "@/styles/app.css";

export const metadata: Metadata = {
  title: "Doubtster app | ask, learn, watch",
  description: "Ask any question, get step by step answers, and turn them into videos, notes, flashcards and quizzes.",
};

export default function Page() {
  return <ClientApp />;
}
