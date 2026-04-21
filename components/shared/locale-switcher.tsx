"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/shared/i18n-provider";
import { apiFetch } from "@/lib/api";
import { type Locale } from "@/lib/i18n/config";

const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" }
];

export function LocaleSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useI18n();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <label htmlFor="locale-switcher" className="sr-only">
        {t("common.language")}
      </label>
      <select
        id="locale-switcher"
        className="bg-transparent text-sm outline-none"
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          startTransition(async () => {
            try {
              await apiFetch("/api/preferences/locale", {
                method: "POST",
                body: JSON.stringify({ locale: nextLocale })
              });
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to switch language");
            }
          });
        }}
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button variant="ghost" size="sm" className="hidden">
        {t("common.language")}
      </Button>
    </div>
  );
}
