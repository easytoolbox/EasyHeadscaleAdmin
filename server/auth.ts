import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export const sessionCookieName = "easy_headscale_admin_session";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const passwordHashPrefix = "scrypt";

type SessionPayload = {
  username: string;
  expiresAt: number;
};

function parseEnvFile() {
  const explicitEnvFile = process.env.EASY_HEADSCALE_ADMIN_ENV_FILE;
  if (explicitEnvFile && existsSync(explicitEnvFile)) {
    const content = readFileSync(explicitEnvFile, "utf8");
    const values: Record<string, string> = {};

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    }

    return values;
  }

  const entryDir = process.argv[1] ? dirname(resolve(process.argv[1])) : process.cwd();
  const fileCandidates = [
    resolve(entryDir, ".env"),
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "../../.env"),
    resolve(__dirname, "../../../.env")
  ];

  for (const filePath of fileCandidates) {
    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    const values: Record<string, string> = {};

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    }

    return values;
  }

  return {} as Record<string, string>;
}

function getRuntimeAuthConfig() {
  const fileEnv = parseEnvFile();

  return {
    username: fileEnv.ADMIN_USERNAME || process.env.ADMIN_USERNAME || env.ADMIN_USERNAME || "",
    passwordHash: fileEnv.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH || env.ADMIN_PASSWORD_HASH || "",
    sessionSecret:
      fileEnv.AUTH_SESSION_SECRET ||
      process.env.AUTH_SESSION_SECRET ||
      env.AUTH_SESSION_SECRET ||
      fileEnv.APP_ENCRYPTION_KEY ||
      process.env.APP_ENCRYPTION_KEY ||
      env.APP_ENCRYPTION_KEY
  };
}

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function getSessionSecret() {
  return getRuntimeAuthConfig().sessionSecret;
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function isAuthConfigured() {
  const config = getRuntimeAuthConfig();
  return Boolean(config.username && config.passwordHash && config.sessionSecret);
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `${passwordHashPrefix}$${toBase64Url(salt)}$${toBase64Url(derivedKey)}`;
}

export function verifyPasswordHash(password: string, storedHash: string) {
  const [scheme, saltValue, derivedKeyValue] = storedHash.split("$");
  if (scheme !== passwordHashPrefix || !saltValue || !derivedKeyValue) {
    return false;
  }

  const salt = fromBase64Url(saltValue);
  const expected = fromBase64Url(derivedKeyValue);
  const actual = scryptSync(password, salt, expected.length);

  return timingSafeEqual(actual, expected);
}

export function createSessionValue(username: string) {
  const payload: SessionPayload = {
    username,
    expiresAt: Date.now() + sessionMaxAgeSeconds * 1000
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature || !safeEqual(signValue(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as SessionPayload;
    if (payload.expiresAt <= Date.now()) {
      return null;
    }

    const config = getRuntimeAuthConfig();
    if (!config.username || payload.username !== config.username) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  };
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(sessionCookieName)?.value);
}

export async function authenticateAdmin(username: string, password: string) {
  const config = getRuntimeAuthConfig();

  if (!isAuthConfigured()) {
    throw new AppError("Authentication is not configured", 503, "AUTH_NOT_CONFIGURED");
  }

  if (username !== config.username || !verifyPasswordHash(password, config.passwordHash)) {
    throw new AppError("Invalid username or password", 401, "INVALID_CREDENTIALS");
  }

  return {
    username
  };
}

export async function requirePageAuth() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function assertApiAuth() {
  const session = await getAuthSession();
  if (!session) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return session;
}

export function normalizeNextPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value === "/login") {
    return "/";
  }

  return value;
}
