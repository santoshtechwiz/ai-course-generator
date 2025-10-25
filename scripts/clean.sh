# 2. Delete the migrations folder (if it exists)
rm -rf prisma/migrations

# 3. Push the schema directly to the database (skips migration files for quick testing)
npx prisma db push --accept-data-loss

# 4. Generate Prisma client based on the current schema
npx prisma generate

# 5. Run the seed script
npx prisma db seed