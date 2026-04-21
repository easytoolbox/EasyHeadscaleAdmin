import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCount } from "@/lib/utils";

export function StatsCard({
  title,
  value,
  hint,
  icon: Icon
}: {
  title: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-semibold">{formatCount(value)}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
