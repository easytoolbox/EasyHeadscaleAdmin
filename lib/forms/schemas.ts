import { z } from "zod";

export const setupSchema = z.object({
  serverUrl: z.string().url("Please enter a valid URL"),
  apiKey: z.string().min(10, "API Key looks too short"),
  name: z.string().min(2).max(50).default("Default Headscale"),
  description: z.string().max(160).optional().or(z.literal(""))
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, dot, underscore or dash")
});

export const renameUserSchema = createUserSchema;

export const renameNodeSchema = z.object({
  name: z.string().min(2).max(63)
});

export const nodeActionSchema = z.object({
  action: z.enum(["delete", "expire", "reassign", "set-tags"]),
  nodeIds: z.array(z.string().min(1)).min(1),
  user: z.string().optional().default(""),
  tags: z.string().optional().default("")
});

export const registerNodeSchema = z.object({
  registrationKey: z.string().min(1),
  user: z.string().min(1)
});

export const approveRegistrationSchema = z.object({
  token: z.string().min(1),
  user: z.string().min(1)
});

export const createPreAuthKeySchema = z.object({
  user: z.string().optional().default(""),
  reusable: z.boolean().default(false),
  ephemeral: z.boolean().default(false),
  expiration: z.string().optional().default(""),
  aclTags: z.string().optional().default("")
});

export const createApiKeySchema = z.object({
  expiration: z.string().optional().default("")
});

export const updateRoutesSchema = z.object({
  routes: z.array(z.string().min(1)).default([])
});

export const cleanupOfflineNodesSchema = z.object({
  nodeIds: z.array(z.string().min(1)).default([])
});

export const searchSchema = z.object({
  query: z.string().min(1)
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  next: z.string().optional().default("")
});

export const timeZoneSchema = z.object({
  timeZone: z.string().min(1)
});

export const aclPolicySchema = z.object({
  policy: z.string().min(2)
});

export const rollbackConfigSchema = z.object({
  auditLogId: z.string().min(1)
});

export const dnsConfigSchema = z.object({
  magicDns: z.boolean().default(true),
  nameservers: z.array(z.string().min(1)).default([]),
  splitDns: z
    .array(
      z.object({
        domain: z.string().min(1),
        nameservers: z.array(z.string().min(1)).default([])
      })
    )
    .default([]),
  extraRecordsPath: z.string().default("")
});

export const derpConfigSchema = z.object({
  embeddedEnabled: z.boolean().default(false),
  verifyClients: z.boolean().default(true),
  regionId: z.coerce.number().int().nonnegative().default(999),
  regionCode: z.string().default("headscale"),
  regionName: z.string().default("Headscale Embedded DERP"),
  urls: z.array(z.string().min(1)).default([]),
  paths: z.array(z.string().min(1)).default([])
});
