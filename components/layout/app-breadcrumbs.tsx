"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/shared/i18n-provider";

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        {t("common.overview")}
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        return (
          <div key={href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link href={href} className="capitalize hover:text-foreground">
              {segment.replace(/-/g, " ")}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
