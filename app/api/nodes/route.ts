import { handleRouteError, ok } from "@/app/api/_utils";
import { assertApiAuth } from "@/server/auth";
import { listNodes } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await listNodes());
  } catch (error) {
    return handleRouteError(error);
  }
}
