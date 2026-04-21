import Link from "next/link";
import { Activity, ArrowUpRight, KeyRound, Route, ShieldCheck, UserRound, Wifi } from "lucide-react";

import { getI18n } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusPill } from "@/components/shared/status-pill";
import { HealthTrendChart } from "@/features/dashboard/health-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type HeadscaleNode, type HeadscaleUser } from "@/lib/headscale/types";
import { formatDateTime } from "@/lib/time";

export async function DashboardOverview({
  stats,
  recentNodes,
  recentUsers,
  health,
  alerts,
  healthTrend,
  timeZone
}: {
  stats: {
    users: number;
    nodes: number;
    activeNodes: number;
    expiredNodes: number;
    routes: number;
    preAuthKeys: number;
  };
  recentNodes: HeadscaleNode[];
  recentUsers: HeadscaleUser[];
  health: {
    connected: boolean;
    version: string;
  };
  alerts: {
    anomalousNodes: HeadscaleNode[];
    pendingRoutes: string[];
    expiringPreAuthKeys: Array<{ id: string; expiration?: string | null }>;
    expiringApiKeys: Array<{ prefix: string; expiration?: string | null }>;
  };
  healthTrend: Array<{
    timestamp: string;
    activeNodes: number;
    expiredNodes: number;
    pendingRoutes: number;
  }>;
  timeZone: string;
}) {
  const { t } = await getI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard title={t("dashboard.users")} value={stats.users} hint={t("dashboard.usersHint")} icon={UserRound} />
        <StatsCard title={t("dashboard.nodes")} value={stats.nodes} hint={t("dashboard.nodesHint", { count: stats.activeNodes })} icon={Wifi} />
        <StatsCard title={t("dashboard.expiredNodes")} value={stats.expiredNodes} hint={t("dashboard.expiredNodesHint")} icon={Activity} />
        <StatsCard title={t("dashboard.routes")} value={stats.routes} hint={t("dashboard.routesHint")} icon={Route} />
        <StatsCard title={t("dashboard.preAuthKeys")} value={stats.preAuthKeys} hint={t("dashboard.preAuthKeysHint")} icon={ShieldCheck} />
        <StatsCard title={t("dashboard.health")} value={health.connected ? 1 : 0} hint={t("dashboard.healthHint", { version: health.version })} icon={KeyRound} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.recentNodes")}</CardTitle>
              <CardDescription>{t("dashboard.recentNodesDescription")}</CardDescription>
            </div>
            <Badge variant={health.connected ? "success" : "destructive"}>
              <StatusPill status={health.connected ? "online" : "error"} />
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNodes.map((node) => (
              <Link
                key={node.id}
                href={`/nodes/${node.id}`}
                className="flex items-center justify-between rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{node.givenName || node.name}</p>
                  <p className="text-sm text-muted-foreground">{node.user?.name ?? t("dashboard.unassigned")} · {(node.ipAddresses ?? []).join(", ") || t("dashboard.noIpYet")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={node.online ? "online" : node.expired ? "warning" : "offline"} />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentUsers")}</CardTitle>
            <CardDescription>{t("dashboard.recentUsersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="flex items-center justify-between rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{user.displayName || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.anomalousNodes")}</CardTitle>
            <CardDescription>{t("dashboard.anomalousNodesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.anomalousNodes.length ? alerts.anomalousNodes.map((node) => (
              <Link key={node.id} href={`/nodes/${node.id}`} className="flex items-center justify-between rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40">
                <div>
                  <p className="font-medium">{node.givenName || node.name}</p>
                  <p className="text-sm text-muted-foreground">{node.user?.name ?? t("dashboard.unassigned")}</p>
                </div>
                <StatusPill status={node.expired ? "warning" : "offline"} />
              </Link>
            )) : <p className="text-sm text-muted-foreground">{t("common.notAvailable")}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.pendingRoutes")}</CardTitle>
            <CardDescription>{t("dashboard.pendingRoutesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.pendingRoutes.length ? alerts.pendingRoutes.map((route) => (
              <div key={route} className="rounded-2xl border border-border/70 p-4">
                <p className="font-medium">{route}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">{t("common.notAvailable")}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.expiringKeys")}</CardTitle>
            <CardDescription>{t("dashboard.expiringKeysDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ...alerts.expiringPreAuthKeys.map((item: { id: string; expiration?: string | null }) => ({ label: item.id, expiration: item.expiration })),
              ...alerts.expiringApiKeys.map((item: { prefix: string; expiration?: string | null }) => ({ label: item.prefix, expiration: item.expiration }))
            ].length ? [
              ...alerts.expiringPreAuthKeys.map((item: { id: string; expiration?: string | null }) => ({ label: item.id, expiration: item.expiration })),
              ...alerts.expiringApiKeys.map((item: { prefix: string; expiration?: string | null }) => ({ label: item.prefix, expiration: item.expiration }))
            ].map((item: { label: string; expiration?: string | null }) => (
              <div key={item.label} className="rounded-2xl border border-border/70 p-4">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.expiration ? formatDateTime(item.expiration, timeZone) : t("common.notAvailable")}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">{t("common.notAvailable")}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.healthTrend")}</CardTitle>
          <CardDescription>{t("dashboard.healthTrendDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthTrendChart points={healthTrend} timeZone={timeZone} />
        </CardContent>
      </Card>
    </div>
  );
}
