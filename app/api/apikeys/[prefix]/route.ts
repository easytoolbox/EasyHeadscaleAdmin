import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { deleteApiKey } from "@/server/headscale-service";

export async function DELETE(_: Request, context: { params: Promise<{ prefix: string }> }) {
  try {
    await assertApiAuth();
    const { prefix } = await context.params;
    await deleteApiKey(assertId(prefix, "prefix"));
    return ok(true);
  } catch (error) {
    return handleRouteError(error);
  }
}
