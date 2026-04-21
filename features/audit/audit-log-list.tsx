"use client";

import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";

import { useI18n } from "@/components/shared/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type AuditLogEntry, summarizeAuditDetail } from "@/lib/config-center";
import { formatDateTime } from "@/lib/time";

function getVariant(targetType: string) {
  if (["node", "route"].includes(targetType)) return "warning";
  if (["acl", "dns", "derp"].includes(targetType)) return "success";
  return "outline";
}

export function AuditLogList({ logs, timeZone }: { logs: AuditLogEntry[]; timeZone: string }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return logs;

    return logs.filter((log) =>
      [
        log.actor,
        log.action,
        log.targetType,
        log.targetId,
        summarizeAuditDetail(log.detail) ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [logs, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("audit.search")} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.length ? filtered.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getVariant(log.targetType)}>{log.targetType}</Badge>
                  <Badge variant="outline">{log.action}</Badge>
                </div>
                <p className="font-medium">{log.targetId}</p>
                <p className="text-sm text-muted-foreground">
                  {t("audit.actorLabel", { actor: log.actor })} · {formatDateTime(log.createdAt, timeZone)}
                </p>
                {summarizeAuditDetail(log.detail) ? (
                  <p className="text-sm text-muted-foreground">{summarizeAuditDetail(log.detail)}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                {t("audit.recorded")}
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t("audit.empty")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
