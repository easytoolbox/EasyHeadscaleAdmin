import { handleRouteError, ok } from "@/app/api/_utils";
import { registerNodeSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { registerNodeToUser } from "@/server/headscale-service";

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = registerNodeSchema.parse(await request.json());
    return ok(await registerNodeToUser(payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
