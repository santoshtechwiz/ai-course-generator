#!/bin/bash

# Render Build Optimization Script
# This script optimizes the build process for Render deployments

echo "🚀 Starting Render build optimization..."

# Enable build caching
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Use npm cache if available
if [ -d "/opt/render/cache/.npm" ]; then
  echo "📦 Using cached npm dependencies..."
  export npm_config_cache="/opt/render/cache/.npm"
fi

# Use Next.js build cache if available
if [ -d "/opt/render/cache/.next" ]; then
  echo "⚡ Using cached Next.js build..."
  export NEXT_CACHE_DIR="/opt/render/cache/.next"
fi

# Install dependencies with caching
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# Create cache directories for next build
mkdir -p /opt/render/cache/.next
mkdir -p /opt/render/cache/.npm

echo "🔨 Building application..."
npm run build

# Cache the build artifacts
if [ -d ".next" ]; then
  echo "💾 Caching build artifacts..."
  cp -r .next/cache /opt/render/cache/.next/ 2>/dev/null || true
fi

echo "✅ Build optimization complete!"