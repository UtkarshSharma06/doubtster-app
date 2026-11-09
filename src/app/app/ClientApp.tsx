"use client";
import dynamic from "next/dynamic";

const AppShell = dynamic(
  () => import("@/components/app/AppShell").then((m) => m.AppShell),
  { ssr: false }
);

export function ClientApp({ user }: { user?: { id: string; email?: string; name?: string } | null }) {
  return <AppShell user={user} />;
}
