"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { loginSchema } from "@/lib/forms/schemas";

type LoginFormValues = {
  username: string;
  password: string;
  next: string;
};

export function LoginForm({
  configured,
  nextPath,
  defaultUsername
}: {
  configured: boolean;
  nextPath: string;
  defaultUsername?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: defaultUsername ?? "",
      password: "",
      next: nextPath
    }
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginFormValues) =>
      apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success(t("auth.loginSuccess"));
      router.replace(nextPath || "/");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))]">
      <div className="mx-auto flex max-w-5xl justify-end gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <ShieldCheck className="mr-2 h-4 w-4" />
            EasyHeadscaleAdmin
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">{t("auth.title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("auth.description")}</p>
          <p className="text-sm text-muted-foreground">{t("auth.nextHint")}</p>
        </div>

        <Card className="border-border/70 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5" />
              {t("common.login")}
            </CardTitle>
            <CardDescription>
              {configured ? t("auth.description") : t("auth.misconfiguredBody")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!configured ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">{t("auth.misconfiguredTitle")}</p>
                <p className="mt-2">{t("auth.misconfiguredBody")}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="login-username">{t("auth.username")}</Label>
              <Input id="login-username" {...form.register("username")} disabled={!configured || loginMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">{t("auth.password")}</Label>
              <Input id="login-password" type="password" {...form.register("password")} disabled={!configured || loginMutation.isPending} />
            </div>
            <Button
              className="w-full"
              onClick={form.handleSubmit((values) => loginMutation.mutate(values))}
              disabled={!configured || loginMutation.isPending}
            >
              {loginMutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
