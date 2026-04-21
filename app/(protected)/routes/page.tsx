import { EmptyState } from "@/components/shared/empty-state";
import { RoutesManager } from "@/features/routes/routes-manager";
import { getI18n } from "@/lib/i18n/server";
import { listRoutes } from "@/server/headscale-service";

export default async function RoutesPage() {
  const routes = await listRoutes();
  const { t } = await getI18n();

  if (!routes.length) {
    return <EmptyState title={t("routes.emptyTitle")} description={t("routes.emptyDescription")} />;
  }

  return <RoutesManager routes={routes} />;
}
