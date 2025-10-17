-- Add missing resetFrequency column to UsageLimit table
ALTER TABLE "UsageLimit" 
ADD COLUMN IF NOT EXISTS "resetFrequency" TEXT NOT NULL DEFAULT 'daily';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'UsageLimit' 
ORDER BY ordinal_position;
