import { handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { listAuditLogs } from "@/server/config-center-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await listAuditLogs());
  } catch (error) {
    return handleRouteError(error);
  }
}
