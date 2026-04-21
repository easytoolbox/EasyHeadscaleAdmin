import { ErrorState } from "@/components/shared/error-state";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { getI18n } from "@/lib/i18n/server";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { getDashboardData } from "@/server/headscale-service";

export default async function DashboardPage() {
  try {
    const [data, timeZone] = await Promise.all([getDashboardData(), getDisplayTimeZone()]);
    return <DashboardOverview {...data} timeZone={timeZone} />;
  } catch (error) {
    const { t } = await getI18n();
    return <ErrorState title={t("errors.dashboardUnavailable")} description={error instanceof Error ? error.message : "Unable to reach Headscale."} />;
  }
}
