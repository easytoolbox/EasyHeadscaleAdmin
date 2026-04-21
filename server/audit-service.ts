import { env } from "@/lib/env";
import { db } from "@/server/db";
import { requireActiveInstance } from "@/server/config-service";

export async function recordAuditEvent(input: {
  action: string;
  targetType: string;
  targetId: string;
  detail?: unknown;
  instanceId?: string;
  actor?: string;
}) {
  const instanceId = input.instanceId ?? (await requireActiveInstance()).id;

  return db.auditLog.create({
    data: {
      instanceId,
      actor: input.actor ?? env.ADMIN_USERNAME ?? "local-admin",
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      detail: input.detail ? JSON.stringify(input.detail) : null
    }
  });
}
