#!/usr/bin/env bash
set -e

# Use Yarn if yarn.lock exists, otherwise use npm
if [ -f yarn.lock ]; then
  PKG_MANAGER="yarn"
else
  PKG_MANAGER="npm"
fi

# Restore node_modules and .next/cache from persistent disk
if [ -d /cache/node_modules ]; then
  echo "Restoring node_modules from cache..."
  rm -rf node_modules
  cp -R /cache/node_modules ./node_modules
fi

if [ -d /cache/.next/cache ]; then
  echo "Restoring .next/cache from cache..."
  mkdir -p .next
  cp -R /cache/.next/cache .next/cache
fi

# Install dependencies (best practice: clean install)
$PKG_MANAGER install --frozen-lockfile || $PKG_MANAGER install

# Build Next.js app (incremental build supported)
$PKG_MANAGER run build

# Save node_modules and .next/cache to persistent disk for next build
rm -rf /cache/node_modules
cp -R ./node_modules /cache/node_modules

rm -rf /cache/.next/cache
mkdir -p /cache/.next
cp -R .next/cache /cache/.next/cache
