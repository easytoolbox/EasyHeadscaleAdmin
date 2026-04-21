import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { deletePreAuthKey } from "@/server/headscale-service";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const { id } = await context.params;
    return ok(await deletePreAuthKey(assertId(id)));
  } catch (error) {
    return handleRouteError(error);
  }
}
