"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(
  () => import("@/components/app/AppShell").then((m) => m.AppShell),
  { ssr: false }
);

export function ClientApp() {
  return <AppShell />;
}
