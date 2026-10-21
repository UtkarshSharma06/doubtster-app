import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";
import "@/styles/auth.css";

export const metadata: Metadata = {
  title: "Log in | Doubtster",
  description: "Log in to your Doubtster account.",
  robots: { index: false },
};

export default function Page() {
  return <AuthPage mode="login" />;
}
