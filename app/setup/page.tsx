import { SetupForm } from "@/features/settings/setup-form";
import { requirePageAuth } from "@/server/auth";
import { getActiveConfigSummary } from "@/server/config-service";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  await requirePageAuth();
  const config = await getActiveConfigSummary();
  return <SetupForm config={config} />;
}
