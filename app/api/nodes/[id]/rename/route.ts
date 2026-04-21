import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { renameNodeSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { renameNode } from "@/server/headscale-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const payload = renameNodeSchema.parse(await request.json());
    const { id } = await context.params;
    return ok(await renameNode(assertId(id), payload.name));
  } catch (error) {
    return handleRouteError(error);
  }
}
