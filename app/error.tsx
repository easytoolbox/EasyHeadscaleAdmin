"use client";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-lg rounded-3xl border border-border bg-card p-8 shadow-soft">
        <h1 className="font-display text-3xl font-semibold">{t("states.globalErrorTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-6" onClick={() => reset()}>
          {t("common.tryAgain")}
        </Button>
      </div>
    </div>
  );
}
