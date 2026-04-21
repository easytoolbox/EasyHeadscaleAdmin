import { cache } from "react";

import { AppError } from "@/lib/errors";
import { type HeadscaleConfigSummary } from "@/lib/headscale/types";
import { maskSecret, normalizeUrl } from "@/lib/utils";
import { decryptSecret, encryptSecret } from "@/server/crypto";
import { db } from "@/server/db";

export const getActiveInstance = cache(async () => {
  return db.headscaleInstance.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" }
  });
});

export async function requireActiveInstance() {
  const instance = await getActiveInstance();
  if (!instance) {
    throw new AppError("Headscale is not configured yet", 412, "SETUP_REQUIRED");
  }

  return instance;
}

export async function getActiveConfigSummary(): Promise<HeadscaleConfigSummary | null> {
  const instance = await getActiveInstance();
  if (!instance) return null;

  let maskedApiKey: string | null = null;
  let requiresReconnect = false;

  try {
    const apiKey = decryptSecret(instance.encryptedApiKey);
    maskedApiKey = maskSecret(apiKey);
  } catch {
    requiresReconnect = true;
  }

  return {
    id: instance.id,
    name: instance.name,
    serverUrl: instance.serverUrl,
    description: instance.description,
    lastValidatedAt: instance.lastValidatedAt?.toISOString() ?? null,
    maskedApiKey,
    requiresReconnect
  };
}

export async function hasUsableActiveConfig() {
  const instance = await getActiveInstance();
  if (!instance) {
    return false;
  }

  try {
    decryptSecret(instance.encryptedApiKey);
    return true;
  } catch {
    return false;
  }
}

export async function getDecryptedConfig() {
  const instance = await requireActiveInstance();

  return {
    ...instance,
    serverUrl: normalizeUrl(instance.serverUrl),
    apiKey: decryptSecret(instance.encryptedApiKey)
  };
}

export async function saveHeadscaleConfig(input: {
  serverUrl: string;
  apiKey: string;
  name: string;
  description?: string | null;
}) {
  const active = await getActiveInstance();
  const data = {
    name: input.name,
    serverUrl: normalizeUrl(input.serverUrl),
    encryptedApiKey: encryptSecret(input.apiKey),
    description: input.description || null,
    active: true,
    lastValidatedAt: new Date()
  };

  if (active) {
    return db.headscaleInstance.update({
      where: { id: active.id },
      data
    });
  }

  return db.headscaleInstance.create({
    data
  });
}

export async function resetHeadscaleConfig() {
  const active = await getActiveInstance();
  if (!active) return;
  await db.headscaleInstance.delete({ where: { id: active.id } });
}
