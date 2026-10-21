import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `${LEGAL["refund-policy"].title} | Doubtster`,
  description: LEGAL["refund-policy"].desc,
};

export default function Page() {
  return <LegalPage doc="refund-policy" />;
}
