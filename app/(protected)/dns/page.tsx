import { PageHeader } from "@/components/shared/page-header";
import { DnsManager } from "@/features/dns/dns-manager";
import { getI18n } from "@/lib/i18n/server";
import { getDnsConfig, listAuditLogs } from "@/server/config-center-service";
import { getDisplayTimeZone } from "@/server/display-settings-service";

export default async function DnsPage() {
  const [{ config }, logs, { t }, timeZone] = await Promise.all([
    getDnsConfig(),
    listAuditLogs(),
    getI18n(),
    getDisplayTimeZone()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("dns.title")} description={t("dns.description")} />
      <DnsManager config={config} history={logs.filter((item) => item.targetType === "dns")} timeZone={timeZone} />
    </div>
  );
}
