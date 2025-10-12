#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MINIAPP_DIR="$ROOT_DIR/apps/miniapp"

function remove_path() {
  local target="$1"
  if [ -e "$target" ]; then
    rm -rf "$target"
    echo "Removed $target"
  else
    echo "Skip $target (not found)"
  fi
}

if [ ! -d "$MINIAPP_DIR" ]; then
  echo "Miniapp directory not found: $MINIAPP_DIR" >&2
  exit 1
fi

remove_path "$MINIAPP_DIR/node_modules"
remove_path "$MINIAPP_DIR/unpackage"

find "$MINIAPP_DIR" -maxdepth 1 -type f \(
  -name "pnpm-lock.yaml" -o \
  -name "package-lock.json" -o \
  -name "yarn.lock"
\) -print -delete

echo "Attempting to prune pnpm store (optional)..."
if command -v pnpm >/dev/null 2>&1; then
  if pnpm store prune; then
    echo "pnpm store pruned"
  else
    echo "pnpm store prune failed (continuing)"
  fi
else
  echo "pnpm not found, skipped pnpm store prune"
fi

echo "Cache clean complete."
