import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding/Onboarding";
import "@/styles/onb.css";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Tell us a little about how you study so Doubtster fits you.",
};

export default function Page() {
  return <Onboarding />;
}
