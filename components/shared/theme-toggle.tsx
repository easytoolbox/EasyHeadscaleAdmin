"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      className="min-w-[112px] justify-center"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("common.themeToggle")}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span>{isDark ? t("common.lightMode") : t("common.darkMode")}</span>
    </Button>
  );
}
