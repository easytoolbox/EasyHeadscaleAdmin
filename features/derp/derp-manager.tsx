"use client";

import { Radar } from "lucide-react";

import { useI18n } from "@/components/shared/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type DerpLiveState } from "@/lib/config-center";

export function DerpManager({ liveState }: { liveState: DerpLiveState }) {
  const { t } = useI18n();
  const enabled = liveState.available ? liveState.embeddedEnabled : false;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("derp.runtimeTitle")}</CardTitle>
            <CardDescription>
              {liveState.available ? t("derp.runtimeDescription") : t("derp.runtimeDescriptionFallback")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("derp.embeddedEnabled")}</p>
              <p className="mt-2 text-2xl font-semibold">{enabled ? t("derp.enabled") : t("derp.disabled")}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {liveState.available ? t("derp.detectedFromDerpMap") : t("derp.liveUnavailable")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("derp.regionId")}</p>
              <p className="mt-2 text-2xl font-semibold">{liveState.regionId}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("derp.liveRegion")}</p>
              <p className="mt-2 text-lg font-semibold">{`${liveState.regionCode} · ${liveState.regionName}`}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("derp.liveNodeCount")}</p>
              <p className="mt-2 text-2xl font-semibold">{liveState.available ? liveState.nodeCount : 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              {t("derp.summaryTitle")}
            </CardTitle>
            <CardDescription>{t("derp.summaryDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={enabled ? "success" : "outline"}>{enabled ? t("derp.enabled") : t("derp.disabled")}</Badge>
            <p className="text-sm text-muted-foreground">
              {liveState.available
                ? t("derp.summaryBody", { region: liveState.regionName, count: liveState.nodeCount })
                : t("derp.summaryFallback")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("derp.liveNodesTitle")}</CardTitle>
          <CardDescription>{t("derp.liveNodesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {liveState.available && liveState.nodes.length ? liveState.nodes.map((node) => (
            <div key={`${node.regionId}-${node.name}-${node.hostName}`} className="rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-2">
                <p className="font-medium">{node.hostName}</p>
                <p className="text-sm text-muted-foreground">{node.name || t("derp.notConfigured")}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    node.ipv4,
                    node.ipv6,
                    node.derpPort ? `DERP:${node.derpPort}` : null,
                    node.stunPort ? `STUN:${node.stunPort}` : null
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">{t("derp.noLiveNodes")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
