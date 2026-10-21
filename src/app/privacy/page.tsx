import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `${LEGAL["privacy"].title} | Doubtster`,
  description: LEGAL["privacy"].desc,
};

export default function Page() {
  return <LegalPage doc="privacy" />;
}
