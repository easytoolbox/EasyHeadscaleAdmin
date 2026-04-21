import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { cleanupOfflineNodesSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { cleanupOfflineUserNodes } from "@/server/headscale-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const payload = cleanupOfflineNodesSchema.parse(await request.json());
    const { id } = await context.params;
    return ok(await cleanupOfflineUserNodes(assertId(id), payload.nodeIds));
  } catch (error) {
    return handleRouteError(error);
  }
}
