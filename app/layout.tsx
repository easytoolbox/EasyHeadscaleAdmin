import type { Metadata } from "next";

import "@/app/globals.css";
import { I18nProvider } from "@/components/shared/i18n-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { SonnerProvider } from "@/components/shared/sonner-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { env } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: `${env.NEXT_PUBLIC_APP_NAME} | Headscale Admin`,
  description: "A modern self-hosted Headscale administration panel built with Next.js."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, messages } = await getI18n();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme={env.NEXT_PUBLIC_DEFAULT_THEME} enableSystem>
          <I18nProvider locale={locale} messages={messages}>
            <QueryProvider>
              {children}
              <SonnerProvider />
            </QueryProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
