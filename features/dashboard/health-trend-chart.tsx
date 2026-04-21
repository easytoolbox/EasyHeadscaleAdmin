"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/shared/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatTime } from "@/lib/time";

type HealthPoint = {
  timestamp: string;
  activeNodes: number;
  expiredNodes: number;
  pendingRoutes: number;
};

const metricStyles = {
  activeNodes: {
    badge: "success" as const,
    fill: "bg-emerald-500/85",
    rail: "bg-emerald-500/10"
  },
  expiredNodes: {
    badge: "warning" as const,
    fill: "bg-amber-500/85",
    rail: "bg-amber-500/10"
  },
  pendingRoutes: {
    badge: "outline" as const,
    fill: "bg-slate-500/85",
    rail: "bg-slate-500/10"
  }
} as const;

export function HealthTrendChart({ points, timeZone }: { points: HealthPoint[]; timeZone: string }) {
  const { t } = useI18n();

  const latest = points.at(-1);
  const maxValue = useMemo(
    () => Math.max(1, ...points.flatMap((point) => [point.activeNodes, point.expiredNodes, point.pendingRoutes])),
    [points]
  );

  if (!latest) {
    return <p className="text-sm text-muted-foreground">{t("common.notAvailable")}</p>;
  }

  const metrics = [
    {
      key: "activeNodes" as const,
      label: t("dashboard.activeNodesLabel"),
      value: latest.activeNodes
    },
    {
      key: "expiredNodes" as const,
      label: t("dashboard.expiredNodesLabel"),
      value: latest.expiredNodes
    },
    {
      key: "pendingRoutes" as const,
      label: t("dashboard.pendingRoutesLabel"),
      value: latest.pendingRoutes
    }
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-3xl border border-border/70 bg-card/70 p-4">
              <Badge variant={metricStyles[metric.key].badge}>{metric.label}</Badge>
              <p className="mt-4 text-4xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(latest.timestamp, timeZone)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 p-4">
          <div
            className="grid items-end gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}
          >
            {points.map((point, index) => (
              <div key={point.timestamp} className="min-w-0 space-y-3">
                <div className="flex h-44 items-end gap-1">
                  {(
                    [
                      ["activeNodes", point.activeNodes],
                      ["expiredNodes", point.expiredNodes],
                      ["pendingRoutes", point.pendingRoutes]
                    ] as const
                  ).map(([key, value]) => {
                    const height = `${Math.max((value / maxValue) * 100, value > 0 ? 18 : 8)}%`;
                    return (
                      <div key={key} className={`flex-1 rounded-full ${metricStyles[key].rail} p-1`}>
                        <div className={`w-full rounded-full ${metricStyles[key].fill}`} style={{ height }} />
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1 text-center">
                  <p className="truncate text-[11px] text-muted-foreground">{formatTime(point.timestamp, timeZone)}</p>
                  {index === points.length - 1 ? (
                    <p className="text-[11px] font-medium text-foreground">{t("dashboard.latestSnapshot")}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {points.slice(-3).reverse().map((point) => (
          <div key={point.timestamp} className="rounded-2xl border border-border/70 p-4">
            <p className="text-xs text-muted-foreground">{formatDateTime(point.timestamp, timeZone)}</p>
            <div className="mt-3 space-y-1 text-sm">
              <p>{t("dashboard.activeNodesLabel")}: {point.activeNodes}</p>
              <p>{t("dashboard.expiredNodesLabel")}: {point.expiredNodes}</p>
              <p>{t("dashboard.pendingRoutesLabel")}: {point.pendingRoutes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
