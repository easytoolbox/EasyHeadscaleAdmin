import { handleRouteError, ok } from "@/app/api/_utils";
import { sessionCookieName } from "@/server/auth";

export async function POST() {
  try {
    const response = ok(true);
    response.cookies.delete(sessionCookieName);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
