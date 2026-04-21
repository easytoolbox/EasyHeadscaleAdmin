import { assertId, handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { deleteUser, getUserDetail } from "@/server/headscale-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const { id } = await context.params;
    return ok(await getUserDetail(assertId(id)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertApiAuth();
    const { id } = await context.params;
    await deleteUser(assertId(id));
    return ok(true);
  } catch (error) {
    return handleRouteError(error);
  }
}
