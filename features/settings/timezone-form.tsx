"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { timezoneOptions } from "@/lib/time";

export function TimezoneForm({ timeZone }: { timeZone: string }) {
  const router = useRouter();
  const { t } = useI18n();

  const mutation = useMutation({
    mutationFn: (nextTimeZone: string) =>
      apiFetch("/api/settings/timezone", { method: "PUT", body: JSON.stringify({ timeZone: nextTimeZone }) }),
    onSuccess: () => {
      toast.success(t("settingsPage.timeZoneSaved"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" />
          {t("settingsPage.timeZoneTitle")}
        </CardTitle>
        <CardDescription>{t("settingsPage.timeZoneDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone-select">{t("settingsPage.timeZoneLabel")}</Label>
          <select
            id="timezone-select"
            defaultValue={timeZone}
            onChange={(event) => mutation.mutate(event.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {timezoneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4 text-sm">
          <span className="text-muted-foreground">{t("settingsPage.currentTimeZone")}</span>
          <span className="font-medium">{timeZone}</span>
        </div>
        {mutation.isPending ? <Button disabled>{t("common.save")}</Button> : null}
      </CardContent>
    </Card>
  );
}
