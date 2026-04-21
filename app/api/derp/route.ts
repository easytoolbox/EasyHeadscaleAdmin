import { handleRouteError, ok } from "@/app/api/_utils";
import { derpConfigSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { getDerpConfig, updateDerpConfig } from "@/server/config-center-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await getDerpConfig());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertApiAuth();
    const payload = derpConfigSchema.parse(await request.json());
    return ok(await updateDerpConfig(payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
