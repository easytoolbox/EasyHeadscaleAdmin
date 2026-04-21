"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, LoaderCircle, ShieldPlus, XCircle } from "lucide-react";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { type HeadscaleNode, type HeadscaleUser } from "@/lib/headscale/types";

export function NodeRegisterCard({ users }: { users: HeadscaleUser[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [registrationKey, setRegistrationKey] = useState("");
  const [user, setUser] = useState(users[0]?.name ?? "");
  const [registeredNode, setRegisteredNode] = useState<HeadscaleNode | null>(null);

  const registerMutation = useMutation({
    mutationFn: (payload: { registrationKey: string; user: string }) =>
      apiFetch<HeadscaleNode>("/api/nodes/register", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: async (node) => {
      toast.success(t("nodes.registeredToast"));
      setRegisteredNode(node);
      setRegistrationKey("");
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldPlus className="h-5 w-5" />
          {t("nodes.registerTitle")}
        </CardTitle>
        <CardDescription>{t("nodes.registerDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="registration-key">{t("nodes.registrationKey")}</Label>
            <Input
              id="registration-key"
              value={registrationKey}
              onChange={(event) => setRegistrationKey(event.target.value)}
              placeholder={t("nodes.registrationKeyPlaceholder")}
              disabled={registerMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-user">{t("nodes.user")}</Label>
            <select
              id="registration-user"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={user}
              onChange={(event) => setUser(event.target.value)}
              disabled={registerMutation.isPending}
            >
              {users.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.displayName ? `${item.displayName} (${item.name})` : item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {registerMutation.isPending ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-3">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium">{t("nodes.registerProcessingTitle")}</p>
                <p className="mt-1">{t("nodes.registerProcessingDescription")}</p>
              </div>
            </div>
          </div>
        ) : null}

        {registerMutation.isSuccess && registeredNode ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-700 dark:text-emerald-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div className="space-y-2">
                <p className="font-medium">{t("nodes.registerSuccessTitle")}</p>
                <p>{t("nodes.registerSuccessDescription", { user })}</p>
                <p>{t("nodes.registerNodeName", { name: registeredNode.givenName || registeredNode.name })}</p>
              </div>
            </div>
          </div>
        ) : null}

        {registerMutation.isError ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm text-rose-700 dark:text-rose-300">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5" />
              <div className="space-y-2">
                <p className="font-medium">{t("nodes.registerErrorTitle")}</p>
                <p>{registerMutation.error.message}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!registrationKey.trim() || !user || registerMutation.isPending}
            onClick={() => {
              setRegisteredNode(null);
              registerMutation.mutate({ registrationKey: registrationKey.trim(), user });
            }}
          >
            {registerMutation.isPending ? t("nodes.registerProcessingButton") : t("nodes.registerAction")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
