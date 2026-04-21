import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <h1 className="font-display text-4xl font-semibold">{t("states.notFoundTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("states.notFoundBody")}
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">{t("common.backToDashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}
