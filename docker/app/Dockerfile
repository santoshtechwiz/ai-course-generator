# Build Stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install necessary build tools and dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /app/models

# Download and extract Vosk model
RUN wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip \
    && unzip vosk-model-small-en-us-0.15.zip \
    && mv vosk-model-small-en-us-0.15/* /app/models/ \
    && rm -rf vosk-model-small-en-us-0.15*

# Install Python packages
RUN pip3 install vosk

# Set environment variables for Prisma
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# First, copy package files
COPY package.json package-lock.json ./

# Remove Windows-specific SWC
RUN npm pkg delete dependencies."@next/swc-win32-x64-msvc"

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["npm", "start"]