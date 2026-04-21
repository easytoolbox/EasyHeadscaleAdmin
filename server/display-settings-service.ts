import { AppError } from "@/lib/errors";
import { isValidTimeZone } from "@/lib/time";
import { db } from "@/server/db";
import { requireActiveInstance } from "@/server/config-service";

const key = "display.timezone";
const defaultTimeZone = "UTC";

export async function getDisplayTimeZone() {
  const instance = await requireActiveInstance();
  const setting = await db.systemSetting.findUnique({
    where: {
      instanceId_key: {
        instanceId: instance.id,
        key
      }
    }
  });

  return setting?.value && isValidTimeZone(setting.value) ? setting.value : defaultTimeZone;
}

export async function updateDisplayTimeZone(timeZone: string) {
  if (!isValidTimeZone(timeZone)) {
    throw new AppError("Invalid time zone", 400, "INVALID_TIME_ZONE");
  }

  const instance = await requireActiveInstance();

  await db.systemSetting.upsert({
    where: {
      instanceId_key: {
        instanceId: instance.id,
        key
      }
    },
    create: {
      instanceId: instance.id,
      key,
      value: timeZone
    },
    update: {
      value: timeZone
    }
  });

  return {
    timeZone
  };
}
