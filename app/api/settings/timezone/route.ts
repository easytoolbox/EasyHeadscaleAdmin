import { handleRouteError, ok } from "@/app/api/_utils";
import { timeZoneSchema } from "@/lib/forms/schemas";
import { assertApiAuth } from "@/server/auth";
import { getDisplayTimeZone, updateDisplayTimeZone } from "@/server/display-settings-service";

export async function GET() {
  try {
    await assertApiAuth();
    return ok(await getDisplayTimeZone());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertApiAuth();
    const payload = timeZoneSchema.parse(await request.json());
    return ok(await updateDisplayTimeZone(payload.timeZone));
  } catch (error) {
    return handleRouteError(error);
  }
}
