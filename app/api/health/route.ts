import { handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { getActiveConfigSummary } from "@/server/config-service";
import { getHealthData } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    const config = await getActiveConfigSummary();
    if (!config) {
      return ok({
        connected: false,
        configured: false
      });
    }

    const health = await getHealthData();
    return ok({
      configured: true,
      ...health
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
