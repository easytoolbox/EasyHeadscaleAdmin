export const localeCookieName = "easy-headscale-admin-locale";

export const supportedLocales = ["en", "zh-CN"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith("zh")) return "zh-CN";
  if (lower.startsWith("en")) return "en";
  return isSupportedLocale(value) ? value : null;
}

export function resolvePreferredLocale(input?: string | null): Locale {
  return normalizeLocale(input) ?? defaultLocale;
}
