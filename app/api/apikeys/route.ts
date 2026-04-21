import { handleRouteError, ok } from "@/app/api/_utils";
import { createApiKeySchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { createApiKey, listApiKeys } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await listApiKeys());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = createApiKeySchema.parse(await request.json());
    return ok(await createApiKey(payload.expiration || undefined));
  } catch (error) {
    return handleRouteError(error);
  }
}
