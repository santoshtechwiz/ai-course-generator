-- Backup script for UsageLimit.resetFrequency data before migration
-- Run this BEFORE applying the migration to preserve data if needed

-- Create backup table
CREATE TABLE IF NOT EXISTS "UsageLimitBackup" AS 
SELECT * FROM "UsageLimit" WHERE "resetFrequency" IS NOT NULL;

-- View the data that will be affected
SELECT 
  id,
  "userId",
  "resourceType",
  "resetFrequency",
  "periodStart",
  "periodEnd"
FROM "UsageLimit" 
WHERE "resetFrequency" IS NOT NULL;

-- If you need to restore this column later, you can:
-- ALTER TABLE "UsageLimit" ADD COLUMN "resetFrequency" TEXT;
-- UPDATE "UsageLimit" ul
-- SET "resetFrequency" = ulb."resetFrequency"
-- FROM "UsageLimitBackup" ulb
-- WHERE ul.id = ulb.id;
