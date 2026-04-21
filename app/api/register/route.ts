import { handleRouteError, ok } from "@/app/api/_utils";
import { approveRegistrationSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { registerPendingNodeForAdmin } from "@/server/headscale-service";

export async function POST(request: Request) {
  try {
    const session = await assertApiAuth();
    const payload = approveRegistrationSchema.parse(await request.json());

    return ok(
      await registerPendingNodeForAdmin({
        token: payload.token,
        adminUsername: session.username,
        user: payload.user
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
