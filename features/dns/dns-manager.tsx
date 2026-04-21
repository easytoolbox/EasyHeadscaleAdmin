"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { History, Save } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import {
  type AuditLogEntry,
  type DnsConfig,
  parseLineList,
  parseSplitDnsInput,
  stringifyLineList,
  stringifySplitDnsInput,
  summarizeAuditDetail,
  summarizeDns
} from "@/lib/config-center";
import { formatDateTime } from "@/lib/time";

export function DnsManager({
  config,
  history,
  timeZone
}: {
  config: DnsConfig;
  history: AuditLogEntry[];
  timeZone: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [magicDns, setMagicDns] = useState(config.magicDns);
  const [nameservers, setNameservers] = useState(stringifyLineList(config.nameservers));
  const [splitDns, setSplitDns] = useState(stringifySplitDnsInput(config.splitDns));
  const [extraRecordsPath, setExtraRecordsPath] = useState(config.extraRecordsPath);

  const payload = useMemo<DnsConfig>(() => ({
    magicDns,
    nameservers: parseLineList(nameservers),
    splitDns: parseSplitDnsInput(splitDns),
    extraRecordsPath: extraRecordsPath.trim()
  }), [extraRecordsPath, magicDns, nameservers, splitDns]);

  const preview = useMemo(() => summarizeDns(payload), [payload]);

  const saveMutation = useMutation({
    mutationFn: () => apiFetch("/api/dns", { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success(t("dns.savedToast"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const rollbackMutation = useMutation({
    mutationFn: (auditLogId: string) =>
      apiFetch("/api/dns/rollback", { method: "POST", body: JSON.stringify({ auditLogId }) }),
    onSuccess: () => {
      toast.success(t("dns.rollbackToast"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("dns.editorTitle")}</CardTitle>
          <CardDescription>{t("dns.editorDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center gap-3 rounded-2xl border border-border/70 p-4">
            <input type="checkbox" checked={magicDns} onChange={(event) => setMagicDns(event.target.checked)} className="h-4 w-4" />
            <div>
              <p className="font-medium">{t("dns.magicDns")}</p>
              <p className="text-sm text-muted-foreground">{t("dns.magicDnsHint")}</p>
            </div>
          </label>

          <div className="space-y-2">
            <Label htmlFor="dns-nameservers">{t("dns.nameservers")}</Label>
            <Textarea
              id="dns-nameservers"
              value={nameservers}
              onChange={(event) => setNameservers(event.target.value)}
              placeholder={t("dns.nameserversPlaceholder")}
              className="min-h-[140px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dns-split">{t("dns.splitDns")}</Label>
            <Textarea
              id="dns-split"
              value={splitDns}
              onChange={(event) => setSplitDns(event.target.value)}
              placeholder={t("dns.splitDnsPlaceholder")}
              className="min-h-[180px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dns-extra-records">{t("dns.extraRecordsPath")}</Label>
            <Input
              id="dns-extra-records"
              value={extraRecordsPath}
              onChange={(event) => setExtraRecordsPath(event.target.value)}
              placeholder={t("dns.extraRecordsPlaceholder")}
            />
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {t("dns.saveConfig")}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("dns.previewTitle")}</CardTitle>
            <CardDescription>{t("dns.previewDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("dns.magicDns")}</p>
              <p className="mt-2 text-2xl font-semibold">{preview.magicDns ? t("dns.enabled") : t("dns.disabled")}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("dns.nameserverCount")}</p>
              <p className="mt-2 text-2xl font-semibold">{preview.nameservers}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("dns.splitDnsRules")}</p>
              <p className="mt-2 text-2xl font-semibold">{preview.splitDnsRules}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("dns.extraRecordsPath")}</p>
              <p className="mt-2 text-sm font-medium">{preview.extraRecordsPath ?? t("dns.notConfigured")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("dns.historyTitle")}
            </CardTitle>
            <CardDescription>{t("dns.historyDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length ? history.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{t("dns.historyUpdatedBy", { actor: log.actor })}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(log.createdAt, timeZone)}</p>
                    {summarizeAuditDetail(log.detail) ? (
                      <p className="text-sm text-muted-foreground">{summarizeAuditDetail(log.detail)}</p>
                    ) : null}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => rollbackMutation.mutate(log.id)} disabled={rollbackMutation.isPending}>
                    {t("dns.rollbackAction")}
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">{t("dns.noHistory")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
