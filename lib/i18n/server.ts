import { cookies, headers } from "next/headers";

import {
  defaultLocale,
  localeCookieName,
  resolvePreferredLocale,
  type Locale
} from "@/lib/i18n/config";
import { getDictionary, translate } from "@/lib/i18n/shared";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (cookieLocale) {
    return resolvePreferredLocale(cookieLocale);
  }

  const acceptLanguage = headerStore.get("accept-language");
  const firstPreferred = acceptLanguage?.split(",")[0]?.trim();

  return resolvePreferredLocale(firstPreferred) ?? defaultLocale;
}

export async function getI18n() {
  const locale = await getCurrentLocale();
  const messages = getDictionary(locale);

  return {
    locale,
    messages,
    t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values)
  };
}
