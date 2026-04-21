#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ROOT_PARENT_DIR="$(dirname "$ROOT_DIR")"
ROOT_NAME="$(basename "$ROOT_DIR")"
TARGET_DIR="${1:-$ROOT_PARENT_DIR/${ROOT_NAME}-github}"

echo "==> Sync EasyHeadscaleAdmin to GitHub publish directory"
echo "Root: $ROOT_DIR"
echo "Target: $TARGET_DIR"

mkdir -p "$TARGET_DIR"

# Clean the publish directory but keep the Git metadata if it already exists.
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name '.gitignore' \
  -exec rm -rf {} +

copy_path() {
  SOURCE="$1"
  DESTINATION="$TARGET_DIR/$1"

  if [ -d "$ROOT_DIR/$SOURCE" ]; then
    mkdir -p "$(dirname "$DESTINATION")"
    cp -R "$ROOT_DIR/$SOURCE" "$DESTINATION"
  elif [ -f "$ROOT_DIR/$SOURCE" ]; then
    mkdir -p "$(dirname "$DESTINATION")"
    cp "$ROOT_DIR/$SOURCE" "$DESTINATION"
  fi
}

# Public source files and deployment assets.
for ITEM in \
  app \
  components \
  features \
  lib \
  prisma \
  public \
  scripts \
  server \
  .dockerignore \
  .env.example \
  Dockerfile \
  README.md \
  README.zh-CN.md \
  build.sh \
  docker-compose.yml \
  next-env.d.ts \
  next.config.ts \
  package.json \
  pnpm-lock.yaml \
  postcss.config.js \
  tailwind.config.ts \
  tsconfig.json \
  tsconfig.typecheck.json
do
  copy_path "$ITEM"
done

rm -f "$TARGET_DIR/prisma/dev.db" "$TARGET_DIR/prisma/dev.db-journal"
find "$TARGET_DIR" -name '.DS_Store' -delete

cat > "$TARGET_DIR/.gitignore" <<'EOF'
.next
node_modules
.env
.env.local
dist
coverage
*.log
prisma/dev.db
prisma/dev.db-journal
EOF

echo "==> Sync complete"
echo "Next steps:"
echo "  cd \"$TARGET_DIR\""
echo "  git status"
echo "  git add ."
echo "  git commit -m \"Update publish snapshot\""
