import { handleRouteError, ok } from "@/app/api/_utils";
import { loginSchema } from "@/lib/forms/schemas";
import { authenticateAdmin, createSessionValue, getSessionCookieOptions, normalizeNextPath, sessionCookieName } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const session = await authenticateAdmin(payload.username, payload.password);
    const response = ok({
      authenticated: true,
      username: session.username,
      next: normalizeNextPath(payload.next)
    });

    response.cookies.set(sessionCookieName, createSessionValue(session.username), getSessionCookieOptions());

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
