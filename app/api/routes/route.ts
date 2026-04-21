import { handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { listRoutes } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await listRoutes());
  } catch (error) {
    return handleRouteError(error);
  }
}
