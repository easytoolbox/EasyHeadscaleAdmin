import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function ErrorState({ title, description }: { title: string; description: string }) {
  const { t } = await getI18n();

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 py-10">
        <div className="rounded-2xl bg-red-500/10 p-3 text-red-600 dark:text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings">{t("errors.openSettings")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
