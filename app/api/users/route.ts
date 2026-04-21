import { handleRouteError, ok } from "@/app/api/_utils";
import { createUserSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { createUser, listUsers } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await listUsers());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = createUserSchema.parse(await request.json());
    return ok(await createUser(payload.name));
  } catch (error) {
    return handleRouteError(error);
  }
}
