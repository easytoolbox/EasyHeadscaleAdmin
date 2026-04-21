import { handleRouteError, ok } from "@/app/api/_utils";
import { createPreAuthKeySchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { createPreAuthKey, listPreAuthKeys } from "@/server/headscale-service";

function resolveExpiration(value?: string) {
  if (!value || value === "never") return undefined;

  const now = Date.now();
  const offsets: Record<string, number> = {
    "1h": 1,
    "6h": 6,
    "12h": 12,
    "24h": 24
  };

  const hours = offsets[value];
  if (!hours) return undefined;

  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await listPreAuthKeys());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = createPreAuthKeySchema.parse(await request.json());
    const tags = payload.aclTags
      ? payload.aclTags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];
    return ok(
      await createPreAuthKey({
        user: payload.user || undefined,
        reusable: payload.reusable,
        ephemeral: payload.ephemeral,
        expiration: resolveExpiration(payload.expiration),
        aclTags: tags
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
