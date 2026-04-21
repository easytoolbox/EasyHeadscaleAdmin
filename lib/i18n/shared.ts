import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

function getValue(source: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : path;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function translate(locale: Locale, key: string, values?: Record<string, string | number>) {
  let template = getValue(getDictionary(locale) as Record<string, unknown>, key);
  if (!values) return template;

  for (const [name, value] of Object.entries(values)) {
    template = template.replaceAll(`{${name}}`, String(value));
  }

  return template;
}
