import { handleRouteError, ok } from "@/app/api/_utils";
import { rollbackConfigSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { rollbackConfig } from "@/server/config-center-service";

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = rollbackConfigSchema.parse(await request.json());
    return ok(await rollbackConfig("derp", payload.auditLogId));
  } catch (error) {
    return handleRouteError(error);
  }
}
