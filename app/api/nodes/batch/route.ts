import { handleRouteError, ok } from "@/app/api/_utils";
import { nodeActionSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { applyNodeBatchAction } from "@/server/headscale-service";

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = nodeActionSchema.parse(await request.json());
    const tags = payload.tags
      ? payload.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

    return ok(
      await applyNodeBatchAction({
        action: payload.action,
        nodeIds: payload.nodeIds,
        user: payload.user || undefined,
        tags
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
