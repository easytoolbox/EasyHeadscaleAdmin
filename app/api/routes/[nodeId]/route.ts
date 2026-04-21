import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { updateRoutesSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { updateNodeRoutes } from "@/server/headscale-service";

export async function PATCH(request: Request, context: { params: Promise<{ nodeId: string }> }) {
  try {
    await assertApiAuth();
    const payload = updateRoutesSchema.parse(await request.json());
    const { nodeId } = await context.params;
    return ok(await updateNodeRoutes(assertId(nodeId, "nodeId"), payload.routes));
  } catch (error) {
    return handleRouteError(error);
  }
}
