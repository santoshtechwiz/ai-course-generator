#!/bin/bash

# Exit script on any error
set -e

# Define paths
MIGRATIONS_DIR="prisma/migrations"
DB_FILE="dev.db"

# Navigate to the script directory (assumes script is in the project root)
cd "$(dirname "$0")"

# Step 1: Remove old migrations
if [ -d "$MIGRATIONS_DIR" ]; then
  echo "Deleting old migrations..."
  rm -rf "$MIGRATIONS_DIR"
else
  echo "No migrations directory found. Skipping deletion."
fi

# Step 2: Remove old database
if [ -f "$DB_FILE" ]; then
  echo "Deleting old database file ($DB_FILE)..."
  rm "$DB_FILE"
else
  echo "No database file found. Skipping deletion."
fi

# Step 3: Generate and apply new migrations
echo "Generating new migration..."
npx prisma migrate dev --name init

# Step 4: Seed the database (optional, if you have a seed script)
if [ -f "prisma/seed.js" ]; then
  echo "Seeding database..."
  node prisma/seed.js
else
  echo "No seed file found. Skipping seeding."
fi

# Done
echo "Database reset and migration completed."
