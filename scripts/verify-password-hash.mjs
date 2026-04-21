import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { scryptSync, timingSafeEqual } from "node:crypto";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const result = {};

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

    result[key] = value;
  }

  return result;
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url");
}

function verifyPasswordHash(password, storedHash) {
  const [scheme, saltValue, derivedKeyValue] = storedHash.split("$");
  if (scheme !== "scrypt" || !saltValue || !derivedKeyValue) {
    return false;
  }

  const salt = fromBase64Url(saltValue);
  const expected = fromBase64Url(derivedKeyValue);
  const actual = scryptSync(password, salt, expected.length);

  return timingSafeEqual(actual, expected);
}

function getPasswordArg(argv) {
  return argv.slice(2).join(" ").trim();
}

const password = getPasswordArg(process.argv);

if (!password) {
  console.error("Usage: pnpm auth:verify 'your-password'");
  process.exit(1);
}

const envFile = resolve(process.cwd(), ".env");
const envFromFile = parseEnvFile(envFile);
const storedHash = process.env.ADMIN_PASSWORD_HASH || envFromFile.ADMIN_PASSWORD_HASH;

if (!storedHash) {
  console.error("ADMIN_PASSWORD_HASH was not found in the current environment or .env file.");
  process.exit(1);
}

if (verifyPasswordHash(password, storedHash)) {
  console.log("Password matches ADMIN_PASSWORD_HASH.");
  process.exit(0);
}

console.error("Password does not match ADMIN_PASSWORD_HASH.");
process.exit(2);
