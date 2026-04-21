#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/dist/1panel-node}"

cd "$ROOT_DIR"

echo "==> EasyHeadscaleAdmin build"
echo "Root: $ROOT_DIR"
echo "Output: $OUTPUT_DIR"

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies"
  pnpm install --no-frozen-lockfile
fi

echo "==> Generating Prisma client"
pnpm db:generate

echo "==> Cleaning previous Next.js build output"
rm -rf "$ROOT_DIR/.next"

echo "==> Building Next.js standalone output"
pnpm build

echo "==> Preparing runtime directory"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/.next"

cp -R "$ROOT_DIR/.next/standalone/." "$OUTPUT_DIR/"
cp -R "$ROOT_DIR/.next/static" "$OUTPUT_DIR/.next/static"

if [ -f "$OUTPUT_DIR/server.js" ]; then
  mv "$OUTPUT_DIR/server.js" "$OUTPUT_DIR/next-server.js"
fi

if [ -d "$ROOT_DIR/public" ]; then
  cp -R "$ROOT_DIR/public" "$OUTPUT_DIR/public"
fi

if [ -d "$ROOT_DIR/prisma" ]; then
  cp -R "$ROOT_DIR/prisma" "$OUTPUT_DIR/prisma"
fi

if [ -f "$ROOT_DIR/package.json" ]; then
  cp "$ROOT_DIR/package.json" "$OUTPUT_DIR/package.json"
fi

if [ -f "$ROOT_DIR/pnpm-lock.yaml" ]; then
  cp "$ROOT_DIR/pnpm-lock.yaml" "$OUTPUT_DIR/pnpm-lock.yaml"
fi

if [ -f "$ROOT_DIR/.env.example" ]; then
  cp "$ROOT_DIR/.env.example" "$OUTPUT_DIR/.env.example"
fi

BUILD_TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat > "$OUTPUT_DIR/BUILD_INFO" <<EOF
build_time_utc=$BUILD_TIMESTAMP
source_dir=$ROOT_DIR
output_dir=$OUTPUT_DIR
EOF

cat > "$OUTPUT_DIR/server.js" <<'EOF'
#!/usr/bin/env node
const { existsSync, writeFileSync } = require("node:fs");
const { dirname, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");

const runtimeDir = process.argv[1] ? dirname(resolve(process.argv[1])) : process.cwd();
const markerFile = resolve(runtimeDir, ".db-deploy.done");
const prismaCliEntry = resolve(runtimeDir, "node_modules/prisma/build/index.js");

function loadDotEnv() {
  const forceOverrideKeys = new Set([
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD_HASH",
    "AUTH_SESSION_SECRET",
    "APP_ENCRYPTION_KEY",
    "DATABASE_URL",
    "PORT"
  ]);

  const envCandidates = [
    resolve(runtimeDir, ".env"),
    resolve(process.cwd(), ".env"),
    resolve(__dirname, ".env"),
    resolve(__dirname, "../.env")
  ];

  for (const envFile of envCandidates) {
    if (!existsSync(envFile)) {
      continue;
    }

    const content = require("node:fs").readFileSync(envFile, "utf8");

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

      if (forceOverrideKeys.has(key) || !(key in process.env)) {
        process.env[key] = value;
      }
    }

    process.env.EASY_HEADSCALE_ADMIN_ENV_FILE = envFile;
    return;
  }
}

function ensureDatabaseDeployed() {
  if (!existsSync(prismaCliEntry)) {
    console.log("==> Installing dependencies with pnpm");
    const installResult = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
      stdio: "inherit",
      env: process.env
    });

    if (installResult.status !== 0) {
      process.exit(installResult.status ?? 1);
    }
  }

  if (existsSync(markerFile)) {
    return;
  }

  console.log("==> Running Prisma migrations");
  const result = spawnSync(process.execPath, [prismaCliEntry, "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  writeFileSync(markerFile, `${new Date().toISOString()}\n`, "utf8");
}

loadDotEnv();
ensureDatabaseDeployed();
require("./next-server.js");
EOF

chmod +x "$OUTPUT_DIR/server.js"

cat > "$OUTPUT_DIR/start.sh" <<'EOF'
#!/usr/bin/env sh
set -eu
node server.js
EOF

chmod +x "$OUTPUT_DIR/start.sh"

cat > "$OUTPUT_DIR/README.runtime.md" <<'EOF'
EasyHeadscaleAdmin runtime bundle for 1Panel Node runtime

1. Copy your production .env into this directory.
2. In 1Panel create a Node runtime site/app.
3. Set the source directory to this bundle directory.
4. Start the app with:
   node server.js

You can also use:
   sh start.sh

On the first startup, the wrapper will automatically run:
   pnpm install --frozen-lockfile
   node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma

After a successful migration, it creates `.db-deploy.done` and then boots Next.js.

This bundle is prepared to run in plain Node environments such as:
   1panel/node:25.8.0

This mode expects pnpm to be available in the target container.
EOF

echo "==> Build completed"
echo "Runtime bundle ready at: $OUTPUT_DIR"
echo "1Panel source directory:"
echo "  $OUTPUT_DIR"
echo "1Panel start command:"
echo "  cd \"$OUTPUT_DIR\" && node server.js"
