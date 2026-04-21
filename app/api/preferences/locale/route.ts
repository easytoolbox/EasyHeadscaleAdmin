import { cookies } from "next/headers";

import { handleRouteError, ok } from "@/app/api/_utils";
import { localeCookieName, resolvePreferredLocale } from "@/lib/i18n/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { locale?: string };
    const locale = resolvePreferredLocale(body.locale);
    const cookieStore = await cookies();

    cookieStore.set(localeCookieName, locale, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });

    return ok({ locale });
  } catch (error) {
    return handleRouteError(error);
  }
}
