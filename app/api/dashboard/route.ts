import { handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { getDashboardData } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await getDashboardData());
  } catch (error) {
    return handleRouteError(error);
  }
}
