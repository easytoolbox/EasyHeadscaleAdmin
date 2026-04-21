"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { type HeadscaleUser } from "@/lib/headscale/types";

type RegistrationApprovalResult = {
  node?: {
    id?: string;
    name?: string;
  };
  user: string;
};

export function RegistrationApproval({
  token,
  adminUsername,
  users
}: {
  token: string;
  adminUsername: string;
  users: HeadscaleUser[];
}) {
  const { t } = useI18n();
  const [selectedUser, setSelectedUser] = useState(
    users.find((user) => user.name === adminUsername || user.id === adminUsername)?.name ?? users[0]?.name ?? ""
  );

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<RegistrationApprovalResult>("/api/register", {
        method: "POST",
        body: JSON.stringify({ token, user: selectedUser })
      });
      return response;
    },
    onSuccess: () => {
      toast.success(t("registration.successToast"));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))]">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <ShieldCheck className="mr-2 h-4 w-4" />
          EasyHeadscaleAdmin
        </div>

        <Card className="mt-6 border-border/70 bg-card/85 shadow-soft backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{t("registration.title")}</CardTitle>
            <CardDescription>{t("registration.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">{t("registration.adminLabel")}</p>
                  <p className="font-medium">{adminUsername}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("registration.tokenLabel")}</p>
                  <p className="break-all font-mono text-xs">{token}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-user-select">{t("registration.userLabel")}</Label>
              <select
                id="registration-user-select"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedUser}
                onChange={(event) => setSelectedUser(event.target.value)}
                disabled={approveMutation.isPending || approveMutation.isSuccess}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.displayName ? `${user.displayName} (${user.name})` : user.name}
                  </option>
                ))}
              </select>
            </div>

            {approveMutation.isPending ? (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-3">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  <div>
                    <p className="font-medium">{t("registration.processingTitle")}</p>
                    <p className="mt-1">{t("registration.processingDescription")}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {approveMutation.isSuccess ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-700 dark:text-emerald-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5" />
                  <div className="space-y-2">
                    <p className="font-medium">{t("registration.successTitle")}</p>
                    <p>{t("registration.successDescription", { user: approveMutation.data.user })}</p>
                    {approveMutation.data.node?.name ? (
                      <p>{t("registration.nodeName", { name: approveMutation.data.node.name })}</p>
                    ) : null}
                    <p>{t("registration.clientHint")}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {approveMutation.isError ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm text-rose-700 dark:text-rose-300">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5" />
                  <div className="space-y-2">
                    <p className="font-medium">{t("registration.errorTitle")}</p>
                    <p>{approveMutation.error.message}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {!approveMutation.isSuccess ? (
                <Button disabled={!selectedUser || approveMutation.isPending} onClick={() => approveMutation.mutate()}>
                  {approveMutation.isPending ? t("registration.processingButton") : t("registration.approveAction")}
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/">{t("common.backToDashboard")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
