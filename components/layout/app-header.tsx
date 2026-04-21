import Link from "next/link";
import { Settings } from "lucide-react";

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { GlobalSearch } from "@/components/shared/global-search";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { LogoutButton } from "@/components/shared/logout-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export async function AppHeader() {
  const { t } = await getI18n();

  return (
    <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 p-5 shadow-soft backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <AppBreadcrumbs />
        <p className="text-sm text-muted-foreground">{t("header.subtitle")}</p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <GlobalSearch />
        <LocaleSwitcher />
        <ThemeToggle />
        <LogoutButton />
        <Button asChild variant="outline">
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            {t("common.settings")}
          </Link>
        </Button>
      </div>
    </header>
  );
}
