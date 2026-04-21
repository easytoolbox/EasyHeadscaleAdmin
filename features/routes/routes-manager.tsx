"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cable, CheckCircle2, Clock3, Route as RouteIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { type HeadscaleRoute } from "@/lib/headscale/types";

export function RoutesManager({ routes }: { routes: HeadscaleRoute[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showPrimaryOnly, setShowPrimaryOnly] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const filteredRoutes = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return routes.filter((route) => {
      const matchesSearch =
        !normalized ||
        route.nodeName.toLowerCase().includes(normalized) ||
        route.prefix.toLowerCase().includes(normalized);
      const matchesPending = !showPendingOnly || !route.enabled;
      const matchesPrimary = !showPrimaryOnly || route.isPrimary;
      const matchesOnline = !showOnlineOnly || route.nodeOnline;
      return matchesSearch && matchesPending && matchesPrimary && matchesOnline;
    });
  }, [routes, search, showOnlineOnly, showPendingOnly, showPrimaryOnly]);

  const grouped = useMemo(
    () =>
      filteredRoutes.reduce<Record<string, HeadscaleRoute[]>>((acc, route) => {
        acc[route.nodeId] ??= [];
        acc[route.nodeId].push(route);
        return acc;
      }, {}),
    [filteredRoutes]
  );

  const summary = useMemo(() => {
    return {
      total: routes.length,
      enabled: routes.filter((route) => route.enabled).length,
      pending: routes.filter((route) => !route.enabled).length,
      nodes: new Set(routes.map((route) => route.nodeId)).size
    };
  }, [routes]);

  const mutation = useMutation({
    mutationFn: async ({ nodeId, routes }: { nodeId: string; routes: string[] }) =>
      apiFetch(`/api/routes/${nodeId}`, { method: "PATCH", body: JSON.stringify({ routes }) }),
    onSuccess: async () => {
      toast.success(t("routes.updatedToast"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("routes.title")} description={t("routes.description")} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title={t("routes.totalRoutes")} value={summary.total} hint={t("routes.totalRoutesHint")} icon={RouteIcon} />
        <StatsCard title={t("routes.enabledRoutes")} value={summary.enabled} hint={t("routes.enabledRoutesHint")} icon={CheckCircle2} />
        <StatsCard title={t("routes.pendingRoutes")} value={summary.pending} hint={t("routes.pendingRoutesHint")} icon={Clock3} />
        <StatsCard title={t("routes.routeNodes")} value={summary.nodes} hint={t("routes.routeNodesHint")} icon={Cable} />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("routes.search")}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={showPendingOnly ? "default" : "outline"} size="sm" onClick={() => setShowPendingOnly((v) => !v)}>
          Pending only
        </Button>
        <Button variant={showPrimaryOnly ? "default" : "outline"} size="sm" onClick={() => setShowPrimaryOnly((v) => !v)}>
          Primary only
        </Button>
        <Button variant={showOnlineOnly ? "default" : "outline"} size="sm" onClick={() => setShowOnlineOnly((v) => !v)}>
          Online nodes
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.entries(grouped).map(([nodeId, nodeRoutes]) => {
          const enabled = nodeRoutes.filter((route) => route.enabled).map((route) => route.prefix);
          const available = nodeRoutes.map((route) => route.prefix);
          return (
            <Card key={nodeId}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>{nodeRoutes[0]?.nodeName}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{t("routes.advertisedRoutes", { count: nodeRoutes.length })}</span>
                    <span>·</span>
                    <span>{t("routes.prefixesLabel")}: {nodeRoutes.map((route) => route.prefix).join(", ")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/nodes/${nodeId}`}>{t("routes.viewNode")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => mutation.mutate({ nodeId, routes: [] })}>
                    {t("common.disableAll")}
                  </Button>
                  <Button size="sm" onClick={() => mutation.mutate({ nodeId, routes: available })}>
                    {t("common.enableAll")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {nodeRoutes.map((route) => (
                  <div key={route.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{route.prefix}</p>
                        <Badge variant="outline">{t("routes.advertised")}</Badge>
                        <Badge variant={route.enabled ? "success" : "warning"}>
                          {route.enabled ? t("routes.approved") : t("routes.pending")}
                        </Badge>
                        {route.isPrimary ? <Badge variant="default">{t("routes.primaryRoute")}</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("routes.nodeLabel")}: {route.nodeName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("routes.rowDescription", {
                          kind: route.isPrimary ? t("routes.primaryRoute") : t("routes.secondaryRoute"),
                          state: route.enabled ? t("routes.approved") : t("routes.pending")
                        })}
                      </p>
                    </div>
                    <Button
                      variant={route.enabled ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        mutation.mutate({
                          nodeId,
                          routes: route.enabled ? enabled.filter((prefix) => prefix !== route.prefix) : [...enabled, route.prefix]
                        })
                      }
                    >
                      {route.enabled ? t("common.disable") : t("common.enable")}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {!Object.keys(grouped).length ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("common.noResults")}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
