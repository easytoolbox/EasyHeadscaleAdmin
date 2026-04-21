import { PencilLine, Server, Timer, Waypoints } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusPill } from "@/components/shared/status-pill";
import { NodeRenameForm } from "@/features/nodes/node-rename-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/time";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { getNodeDetail } from "@/server/headscale-service";

export default async function NodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [node, timeZone] = await Promise.all([getNodeDetail(id), getDisplayTimeZone()]);
  const { t } = await getI18n();

  return (
    <div className="space-y-6">
      <PageHeader title={node.givenName || node.name} description={t("nodes.detailDescription", { user: node.user?.name ?? t("common.notAvailable"), count: (node.ipAddresses ?? []).length })} />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t("nodes.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">{t("nodes.nodeId")}:</span> {node.id}</p>
            <p><span className="text-muted-foreground">{t("nodes.givenName")}:</span> {node.givenName || t("common.notAvailable")}</p>
            <p><span className="text-muted-foreground">{t("nodes.machineName")}:</span> {node.name}</p>
            <p><span className="text-muted-foreground">{t("nodes.user")}:</span> {node.user?.name ?? t("common.notAvailable")}</p>
            <p><span className="text-muted-foreground">{t("nodes.ipAddresses")}:</span> {(node.ipAddresses ?? []).join(", ") || t("common.notAvailable")}</p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("nodes.status")}:</span>
              <StatusPill status={node.online ? "online" : node.expired ? "warning" : "offline"} />
            </div>
            <p><span className="text-muted-foreground">{t("nodes.tags")}:</span> {(node.tags ?? []).join(", ") || t("common.notAvailable")}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PencilLine className="h-5 w-5" />
                {t("nodes.rename")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NodeRenameForm id={node.id} currentName={node.givenName || node.name} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                {t("nodes.lifecycle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">{t("users.created")}:</span> {node.createdAt ? formatDateTime(node.createdAt, timeZone) : t("common.notAvailable")}</p>
              <p><span className="text-muted-foreground">{t("nodes.lastSeen")}:</span> {node.lastSeen ? formatDateTime(node.lastSeen, timeZone) : t("common.notAvailable")}</p>
              <p><span className="text-muted-foreground">{t("nodes.expiry")}:</span> {node.expiry ? formatDateTime(node.expiry, timeZone) : t("preauthkeys.never")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waypoints className="h-5 w-5" />
                {t("nodes.routing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">{t("nodes.availableRoutes")}:</span> {(node.availableRoutes ?? []).join(", ") || t("common.notAvailable")}</p>
              <p><span className="text-muted-foreground">{t("nodes.approvedRoutes")}:</span> {(node.approvedRoutes ?? []).join(", ") || t("common.notAvailable")}</p>
              <p><span className="text-muted-foreground">{t("nodes.primaryRoutes")}:</span> {(node.primaryRoutes ?? []).join(", ") || t("common.notAvailable")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
