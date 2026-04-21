import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { Boxes, Cable, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const { t } = await getI18n();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-2xl bg-muted p-4">
          <Boxes className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Button asChild>
            <Link href={actionHref}>
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">
            <Cable className="h-4 w-4" />
            {t("states.emptyFallback")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
