"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, History, Save } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { type AuditLogEntry, parseAclPolicy, summarizeAuditDetail } from "@/lib/config-center";
import { formatDateTime } from "@/lib/time";

export function AclManager({
  policy: initialPolicy,
  summary,
  history,
  timeZone
}: {
  policy: string;
  summary: { groups: number; tagOwners: number; acls: number };
  history: AuditLogEntry[];
  timeZone: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [policy, setPolicy] = useState(initialPolicy);

  const preview = useMemo(() => {
    try {
      return {
        valid: true,
        summary: parseAclPolicy(policy).summary,
        error: null
      };
    } catch (error) {
      return {
        valid: false,
        summary,
        error: error instanceof Error ? error.message : t("acl.invalidPolicy")
      };
    }
  }, [policy, summary, t]);

  const saveMutation = useMutation({
    mutationFn: () => apiFetch("/api/acl", { method: "PUT", body: JSON.stringify({ policy }) }),
    onSuccess: () => {
      toast.success(t("acl.savedToast"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const rollbackMutation = useMutation({
    mutationFn: (auditLogId: string) =>
      apiFetch("/api/acl/rollback", { method: "POST", body: JSON.stringify({ auditLogId }) }),
    onSuccess: () => {
      toast.success(t("acl.rollbackToast"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t("acl.editorTitle")}</CardTitle>
          <CardDescription>{t("acl.editorDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={policy}
            onChange={(event) => setPolicy(event.target.value)}
            className="min-h-[520px] font-mono text-xs"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !preview.valid}>
              <Save className="h-4 w-4" />
              {t("acl.savePolicy")}
            </Button>
            <Badge variant={preview.valid ? "success" : "destructive"}>
              {preview.valid ? t("acl.validPolicy") : t("acl.invalidPolicy")}
            </Badge>
          </div>
          {!preview.valid ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                {t("acl.validationError")}
              </div>
              <p>{preview.error}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("acl.previewTitle")}</CardTitle>
            <CardDescription>{t("acl.previewDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("acl.groups")}</p>
              <p className="mt-2 text-2xl font-semibold">{preview.summary.groups}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("acl.tagOwners")}</p>
              <p className="mt-2 text-2xl font-semibold">{preview.summary.tagOwners}</p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">{t("acl.aclRules")}</p>
              <p className="mt-2 text-2xl font-semibold">{preview.summary.acls}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("acl.historyTitle")}
            </CardTitle>
            <CardDescription>{t("acl.historyDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length ? history.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{t("acl.historyUpdatedBy", { actor: log.actor })}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(log.createdAt, timeZone)}</p>
                    {summarizeAuditDetail(log.detail) ? (
                      <p className="text-sm text-muted-foreground">{summarizeAuditDetail(log.detail)}</p>
                    ) : null}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => rollbackMutation.mutate(log.id)} disabled={rollbackMutation.isPending}>
                    {t("acl.rollbackAction")}
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">{t("acl.noHistory")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
