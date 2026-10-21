import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `${LEGAL["terms"].title} | Doubtster`,
  description: LEGAL["terms"].desc,
};

export default function Page() {
  return <LegalPage doc="terms" />;
}
