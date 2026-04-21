import { PageHeader } from "@/components/shared/page-header";
import { AclManager } from "@/features/acl/acl-manager";
import { getI18n } from "@/lib/i18n/server";
import { getAclConfig, listAuditLogs } from "@/server/config-center-service";
import { getDisplayTimeZone } from "@/server/display-settings-service";

export default async function AclPage() {
  const [{ policy, summary }, logs, { t }, timeZone] = await Promise.all([
    getAclConfig(),
    listAuditLogs(),
    getI18n(),
    getDisplayTimeZone()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("acl.title")} description={t("acl.description")} />
      <AclManager policy={policy} summary={summary} history={logs.filter((item) => item.targetType === "acl")} timeZone={timeZone} />
    </div>
  );
}
