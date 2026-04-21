import { handleRouteError, ok } from "@/app/api/_utils";
import { searchSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { searchResources } from "@/server/headscale-service";

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = searchSchema.parse(await request.json());
    return ok(await searchResources(payload.query));
  } catch (error) {
    return handleRouteError(error);
  }
}
