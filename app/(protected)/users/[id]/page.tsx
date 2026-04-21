import Link from "next/link";
import { Network, Trash2, UserRound } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { UserTools } from "@/features/users/user-tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/time";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { getUserDetail } from "@/server/headscale-service";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ user, nodes, preAuthKeys, routes }, timeZone] = await Promise.all([getUserDetail(id), getDisplayTimeZone()]);
  const { t } = await getI18n();
  const offlineNodeIds = nodes.filter((node) => !node.online).map((node) => node.id);

  return (
    <div className="space-y-6">
      <PageHeader title={user.displayName || user.name} description={t("users.detailDescription", { name: user.name, count: nodes.length })} />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              {t("users.details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <UserTools userId={user.id} currentName={user.name} offlineNodeIds={offlineNodeIds} />
            <p><span className="text-muted-foreground">{t("users.id")}:</span> {user.id}</p>
            <p><span className="text-muted-foreground">{t("users.name")}:</span> {user.name}</p>
            <p><span className="text-muted-foreground">{t("users.displayName")}:</span> {user.displayName || t("common.notAvailable")}</p>
            <p><span className="text-muted-foreground">{t("users.created")}:</span> {user.createdAt ? formatDateTime(user.createdAt, timeZone) : t("common.notAvailable")}</p>
            <Button variant="outline" asChild className="mt-3">
              <Link href="/users">
                <Trash2 className="h-4 w-4" />
                {t("sidebar.users")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              {t("users.ownedNodes")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nodes.map((node) => (
              <Link
                href={`/nodes/${node.id}`}
                key={node.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{node.givenName || node.name}</p>
                  <p className="text-sm text-muted-foreground">{(node.ipAddresses ?? []).join(", ") || t("common.notAvailable")} · {(node.tags ?? []).join(", ") || t("common.notAvailable")}</p>
                </div>
                <span className="text-sm text-muted-foreground">{node.online ? t("common.online") : t("common.offline")}</span>
              </Link>
            ))}
            {!nodes.length ? <p className="text-sm text-muted-foreground">{t("users.noNodes")}</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("users.preAuthKeysSection")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {preAuthKeys.length ? preAuthKeys.map((key) => (
              <div key={key.id} className="rounded-2xl border border-border/70 p-4">
                <p className="font-medium">{key.id}</p>
                <p className="text-muted-foreground">{key.expiration ? formatDateTime(key.expiration, timeZone) : t("preauthkeys.never")}</p>
              </div>
            )) : <p className="text-muted-foreground">{t("users.noPreAuthKeys")}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("users.routesSection")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {routes.length ? routes.map((route) => (
              <div key={route.id} className="rounded-2xl border border-border/70 p-4">
                <p className="font-medium">{route.prefix}</p>
                <p className="text-muted-foreground">{route.nodeName}</p>
              </div>
            )) : <p className="text-muted-foreground">{t("users.noRoutes")}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
