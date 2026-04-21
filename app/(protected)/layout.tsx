import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { hasUsableActiveConfig } from "@/server/config-service";
import { requirePageAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requirePageAuth();
  const hasConfig = await hasUsableActiveConfig();

  if (!hasConfig) {
    redirect("/setup");
  }

  return <AppShell>{children}</AppShell>;
}
