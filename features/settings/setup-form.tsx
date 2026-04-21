"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { setupSchema } from "@/lib/forms/schemas";
import { type HeadscaleConfigSummary } from "@/lib/headscale/types";

type FormValues = {
  serverUrl: string;
  apiKey: string;
  name: string;
  description?: string;
};

export function SetupForm({
  config,
  embedded = false
}: {
  config: HeadscaleConfigSummary | null;
  embedded?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const form = useForm<FormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      serverUrl: config?.serverUrl ?? "",
      apiKey: "",
      name: config?.name ?? "Default Headscale",
      description: config?.description ?? ""
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload: FormValues) => apiFetch("/api/setup", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success(t("setup.savedToast"));
      router.push("/");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const resetMutation = useMutation({
    mutationFn: () => apiFetch("/api/setup", { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("setup.resetToast"));
      form.reset({
        serverUrl: "",
        apiKey: "",
        name: "Default Headscale",
        description: ""
      });
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className={embedded ? "space-y-6" : "mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6"}>
      {!embedded ? (
        <div className="space-y-2">
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t("setup.badge")}
          </div>
          <h1 className="font-display text-4xl font-semibold">{t("setup.title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("setup.description")}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("setup.connectionDetails")}</CardTitle>
            <CardDescription>{t("setup.connectionHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config?.requiresReconnect ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
                {t("setup.reconnectHint")}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="name">{t("setup.instanceLabel")}</Label>
              <Input id="name" placeholder={t("setup.instancePlaceholder")} {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serverUrl">{t("setup.serverUrl")}</Label>
              <Input id="serverUrl" placeholder={t("setup.serverPlaceholder")} {...form.register("serverUrl")} />
              {form.formState.errors.serverUrl ? <p className="text-sm text-red-600">{form.formState.errors.serverUrl.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">{t("setup.apiKey")}</Label>
              <Input id="apiKey" type="password" placeholder={t("setup.apiPlaceholder")} {...form.register("apiKey")} />
              {config?.maskedApiKey ? <p className="text-sm text-muted-foreground">{t("common.currentKey", { value: config.maskedApiKey })}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("setup.descriptionLabel")}</Label>
              <Textarea id="description" placeholder={t("setup.descriptionPlaceholder")} {...form.register("description")} />
            </div>
            <div className="flex gap-3">
              <Button onClick={form.handleSubmit((values) => saveMutation.mutate(values))} disabled={saveMutation.isPending}>
                {t("common.validateAndSave")}
              </Button>
              {config ? (
                <Button variant="outline" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
                  {t("common.disconnect")}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("setup.scopeTitle")}</CardTitle>
            <CardDescription>{t("setup.scopeDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t("setup.scopeBody1")}</p>
            <p>{t("setup.scopeBody2")}</p>
            <p>{t("setup.scopeBody3")}</p>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-foreground">
              <p className="font-medium">{t("setup.dockerApiKeyTitle")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("setup.dockerApiKeyDescription")}</p>
              <div className="mt-3 rounded-xl border border-border/70 bg-background p-3 font-mono text-xs leading-6">
                docker exec -it headscale headscale apikeys create --expiration 90d
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("setup.dockerApiKeyHint")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
