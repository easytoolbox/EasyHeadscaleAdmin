import { PageHeader } from "@/components/shared/page-header";
import { DerpManager } from "@/features/derp/derp-manager";
import { getI18n } from "@/lib/i18n/server";
import { getDerpConfig } from "@/server/config-center-service";

export default async function DerpPage() {
  const [{ liveState }, { t }] = await Promise.all([
    getDerpConfig(),
    getI18n()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("derp.title")} description={t("derp.description")} />
      <DerpManager liveState={liveState} />
    </div>
  );
}
