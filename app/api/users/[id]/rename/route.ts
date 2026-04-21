import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { renameUserSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { renameUser } from "@/server/headscale-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const payload = renameUserSchema.parse(await request.json());
    const { id } = await context.params;
    return ok(await renameUser(assertId(id), payload.name));
  } catch (error) {
    return handleRouteError(error);
  }
}
