import Link from "next/link";
import { KeyRound, Route, ShieldCheck, UserRound, Wifi } from "lucide-react";

import { getI18n } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type GlobalSearchResult } from "@/lib/headscale/types";
import { formatDateTime } from "@/lib/time";

function ResultSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export async function SearchResults({
  query,
  results,
  timeZone
}: {
  query: string;
  results: GlobalSearchResult;
  timeZone: string;
}) {
  const { t } = await getI18n();

  return (
    <div className="space-y-6">
      <PageHeader title={t("searchPage.title", { query })} description={t("searchPage.description")} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ResultSection title={t("searchPage.users", { count: results.users.length })} icon={<UserRound className="h-5 w-5" />}>
          {results.users.map((user) => (
            <Link key={user.id} href={`/users/${user.id}`} className="block rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40">
              <p className="font-medium">{user.displayName || user.name}</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </Link>
          ))}
        </ResultSection>

        <ResultSection title={t("searchPage.nodes", { count: results.nodes.length })} icon={<Wifi className="h-5 w-5" />}>
          {results.nodes.map((node) => (
            <Link key={node.id} href={`/nodes/${node.id}`} className="block rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40">
              <p className="font-medium">{node.givenName || node.name}</p>
              <p className="text-sm text-muted-foreground">{node.user?.name ?? t("common.notAvailable")} · {(node.ipAddresses ?? []).join(", ")}</p>
            </Link>
          ))}
        </ResultSection>

        <ResultSection title={t("searchPage.routes", { count: results.routes.length })} icon={<Route className="h-5 w-5" />}>
          {results.routes.map((route) => (
            <Link key={route.id} href="/routes" className="block rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40">
              <p className="font-medium">{route.prefix}</p>
              <p className="text-sm text-muted-foreground">{route.nodeName}</p>
            </Link>
          ))}
        </ResultSection>

        <ResultSection title={t("searchPage.preAuthKeys", { count: results.preAuthKeys.length })} icon={<ShieldCheck className="h-5 w-5" />}>
          {results.preAuthKeys.map((key) => (
            <Link key={key.id} href="/preauthkeys" className="block rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40">
              <p className="font-medium">{key.id}</p>
              <p className="text-sm text-muted-foreground">{key.user?.name ?? t("preauthkeys.global")}</p>
            </Link>
          ))}
        </ResultSection>

        <ResultSection title={t("searchPage.apiKeys", { count: results.apiKeys.length })} icon={<KeyRound className="h-5 w-5" />}>
          {results.apiKeys.map((key) => (
            <Link key={key.prefix} href="/apikeys" className="block rounded-2xl border border-border/70 p-4 transition hover:bg-muted/40">
              <p className="font-medium">{key.prefix}</p>
              <p className="text-sm text-muted-foreground">{key.expiration ? formatDateTime(key.expiration, timeZone) : t("apikeys.never")}</p>
            </Link>
          ))}
        </ResultSection>
      </div>
    </div>
  );
}
