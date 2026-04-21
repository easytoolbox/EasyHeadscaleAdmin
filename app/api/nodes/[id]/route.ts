import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { deleteNode, getNodeDetail } from "@/server/headscale-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const { id } = await context.params;
    return ok(await getNodeDetail(assertId(id)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const { id } = await context.params;
    await deleteNode(assertId(id));
    return ok(true);
  } catch (error) {
    return handleRouteError(error);
  }
}
