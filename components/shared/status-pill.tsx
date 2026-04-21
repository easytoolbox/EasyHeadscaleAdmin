"use client";

import { useI18n } from "@/components/shared/i18n-provider";
import { Badge } from "@/components/ui/badge";

export function StatusPill({ status }: { status: "online" | "offline" | "warning" | "error" | "configured" }) {
  const { t } = useI18n();
  const variant =
    status === "online" || status === "configured"
      ? "success"
      : status === "warning"
        ? "warning"
        : status === "error"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{t(`common.${status}`)}</Badge>;
}
