import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  APP_ENCRYPTION_KEY: z.string().min(16).default("replace-with-a-long-random-secret-at-least-32-chars"),
  AUTH_SESSION_SECRET: z.string().min(16).optional().default("replace-with-another-long-random-secret-at-least-32-chars"),
  ADMIN_USERNAME: z.string().default(""),
  ADMIN_PASSWORD_HASH: z.string().default(""),
  NEXT_PUBLIC_BASE_PATH: z.string().default(""),
  NEXT_PUBLIC_APP_NAME: z.string().default("EasyHeadscaleAdmin"),
  NEXT_PUBLIC_DEFAULT_THEME: z.enum(["light", "dark", "system"]).default("system"),
  HEADSCALE_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000)
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
  AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_DEFAULT_THEME: process.env.NEXT_PUBLIC_DEFAULT_THEME,
  HEADSCALE_REQUEST_TIMEOUT_MS: process.env.HEADSCALE_REQUEST_TIMEOUT_MS
});
