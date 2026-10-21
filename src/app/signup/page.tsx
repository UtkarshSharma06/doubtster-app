import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";
import "@/styles/auth.css";

export const metadata: Metadata = {
  title: "Sign up | Doubtster",
  description: "Create your free Doubtster account. Chat is always free.",
  robots: { index: false },
};

export default function Page() {
  return <AuthPage mode="signup" />;
}
