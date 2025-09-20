# Build Stage
# Optimized for:
# 1. Better layer caching (dependencies separate from code)
# 2. Optional Vosk model download at runtime (much faster builds)
# 3. Reduced image size (apt/npm cache cleanup)
# 4. Sane URL defaults to avoid Invalid URL errors
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Build-time arguments (can be passed with --build-arg) - mirrored into production ENV below
ARG NODE_ENV
ARG PORT
ARG VOSK_MODEL_PATH
ARG NEXT_TELEMETRY_DISABLED
ARG NODE_TLS_REJECT_UNAUTHORIZED
ARG NEXT_PUBLIC_REDUX_SAFETY_CHECKS
ARG NEXT_PUBLIC_FORCE_REDUX_DEVTOOLS
ARG YOUTUBE_API_KEY
ARG SUPDATA_KEY
ARG SUPDATA_KEY1
ARG DATABASE_URL_BACKUP
ARG DISABLE_STATIC_SLUG
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_BASIC_PRICE_ID
ARG STRIPE_PREMIUM_PRICE_ID
ARG STRIPE_ULTIMATE_PRICE_ID
ARG NEXTAUTH_SECRET
ARG REDIRECT
ARG LOG_ENDPOINT
ARG LOG_LEVEL
ARG NEXT_PUBLIC_LOG_LEVEL
ARG NEXT_PUBLIC_ENABLE_LOGS
ARG OPENAI_API_KEY
ARG RESEND_API_KEY
ARG EMAIL_FROM
ARG DATABASE_URL_PROD
ARG GOOGLE_GENERATIVE_AI_API_KEY
ARG AI_PROVIDER_TYPE
ARG AI_PROVIDER_API_KEY
ARG AI_MODEL_FREE
ARG AI_MODEL_BASIC
ARG AI_MODEL_PREMIUM
ARG AI_MODEL_ULTIMATE
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG GITHUB_CLIENT_ID_IO
ARG GITHUB_CLIENT_SECRET_IO
ARG NEXT_PUBLIC_URL
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG VERCEL_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_SITE_DESCRIPTION
ARG NEXT_PUBLIC_GOOGLE_VERIFICATION
ARG NEXT_PUBLIC_YANDEX_VERIFICATION
ARG NEXT_PUBLIC_BING_VERIFICATION
ARG NEXT_PUBLIC_PINTEREST_VERIFICATION
ARG NEXT_PUBLIC_FACEBOOK_VERIFICATION
ARG NEXT_PUBLIC_FACEBOOK_APP_ID
ARG CACHE_DEBUG
ARG UNSPLASH_API_KEY
ARG NEXT_PUBLIC_STORAGE_SECRET
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN
ARG ADMIN_EMAIL
ARG API_URL
ARG MAILCHIMP_API_KEY
ARG MAILCHIMP_SERVER_PREFIX
ARG MAILCHIMP_LIST_ID
ARG EMBEDDING_STORAGE_MODE
ARG PAYMENT_GATEWAY_PROVIDER
ARG PAYPAL_CLIENT_ID
ARG PAYPAL_CLIENT_SECRET
ARG SQUARE_ACCESS_TOKEN
# Build Stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies - fewer packages and clean cache in same layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Copy only the files needed for dependency installation first
# This creates a separate layer that won't change unless package files change
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
# Clean npm cache in same layer to keep image small
RUN npm pkg delete scripts.prepare && \
    npm pkg set dependencies.@next/swc-linux-x64-gnu="15.5.3" && \
    npm pkg delete dependencies.@next/swc-win32-x64-msvc && \
    npm config set legacy-peer-deps true && \
    npm ci --unsafe-perm && \
    npx prisma generate && \
    npm cache clean --force

# Copy application code as a separate layer AFTER dependency installation
# This way, code changes don't trigger npm install every time
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-slim AS production

# Set working directory
WORKDIR /app

# Install ffmpeg and utilities for audio processing and model download
# Use --no-install-recommends to reduce size
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    ffmpeg \
    wget \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create directories for models
RUN mkdir -p /app/models

# Copy runtime helper scripts (use repo files to avoid CRLF/heredoc problems on Windows)
COPY --chmod=755 download-model.sh /usr/local/bin/download-model.sh

# Copy node_modules and built application from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .
COPY --from=builder /app/next.config.mjs .
# Copy .env into the image so the entrypoint can load it at runtime (ensure you have .env in build context)
COPY .env /app/.env

# Set environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV VOSK_MODEL_PATH=/app/models/vosk-model
# Controls model download at startup (set to true to download model)
ENV DOWNLOAD_VOSK_MODEL=false
# Set default URL values to avoid "Invalid URL" errors
ENV NEXT_PUBLIC_URL=https://courseai.io
ENV NEXT_PUBLIC_SITE_URL=https://courseai.io 
ENV NEXTAUTH_URL=http://localhost:3000

# Expose the port the app runs on
EXPOSE 3000

# Copy the entrypoint script (ensures LF line endings and executable bit)
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Use entrypoint script and default command
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]