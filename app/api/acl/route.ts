import { handleRouteError, ok } from "@/app/api/_utils";
import { aclPolicySchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { getAclConfig, updateAclConfig } from "@/server/config-center-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await getAclConfig());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertApiAuth();
    const payload = aclPolicySchema.parse(await request.json());
    return ok(await updateAclConfig(payload.policy));
  } catch (error) {
    return handleRouteError(error);
  }
}
