import { PageHeader } from "@/components/shared/page-header";
import { AuditLogList } from "@/features/audit/audit-log-list";
import { getI18n } from "@/lib/i18n/server";
import { listAuditLogs } from "@/server/config-center-service";
import { getDisplayTimeZone } from "@/server/display-settings-service";

export default async function AuditLogsPage() {
  const [logs, { t }, timeZone] = await Promise.all([listAuditLogs(), getI18n(), getDisplayTimeZone()]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("audit.title")} description={t("audit.description")} />
      <AuditLogList logs={logs} timeZone={timeZone} />
    </div>
  );
}
