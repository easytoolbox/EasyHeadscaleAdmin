import { handleRouteError, ok } from "@/app/api/_utils";
import { dnsConfigSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { getDnsConfig, updateDnsConfig } from "@/server/config-center-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await getDnsConfig());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertApiAuth();
    const payload = dnsConfigSchema.parse(await request.json());
    return ok(await updateDnsConfig(payload));
  } catch (error) {
    return handleRouteError(error);
  }
}
