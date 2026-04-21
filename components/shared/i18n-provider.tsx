"use client";

import { createContext, useContext } from "react";

import { type Locale } from "@/lib/i18n/config";
import { type Dictionary } from "@/lib/i18n/dictionaries";
import { translate } from "@/lib/i18n/shared";

const I18nContext = createContext<{
  locale: Locale;
  messages: Dictionary;
} | null>(null);

export function I18nProvider({
  locale,
  messages,
  children
}: {
  locale: Locale;
  messages: Dictionary;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return {
    locale: context.locale,
    t: (key: string, values?: Record<string, string | number>) => translate(context.locale, key, values)
  };
}
