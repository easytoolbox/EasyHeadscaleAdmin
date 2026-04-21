import { NextResponse } from "next/server";

import { handleRouteError, ok } from "@/app/api/_utils";
import { setupSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { getActiveConfigSummary, resetHeadscaleConfig, saveHeadscaleConfig } from "@/server/config-service";
import { validateHeadscaleConfig } from "@/server/headscale-service";

export async function GET() {
  try {
    await assertApiAuth();
    const config = await getActiveConfigSummary();
    return ok(config);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertApiAuth();
    const payload = setupSchema.parse(await request.json());
    const version = await validateHeadscaleConfig({
      serverUrl: payload.serverUrl,
      apiKey: payload.apiKey
    });

    const instance = await saveHeadscaleConfig(payload);

    return ok({
      id: instance.id,
      version
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    await assertApiAuth();
    await resetHeadscaleConfig();
    return NextResponse.json({ data: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
