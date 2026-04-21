import { randomBytes, scryptSync } from "node:crypto";

function getPasswordArg(argv) {
  return argv.slice(2).join(" ").trim();
}

const password = getPasswordArg(process.argv);

if (!password) {
  console.error("Usage: pnpm auth:hash 'your-password'");
  process.exit(1);
}

const salt = randomBytes(16);
const derivedKey = scryptSync(password, salt, 64);
const hash = `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;

console.log(hash);
