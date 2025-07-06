-- Migration: Fix Subscription Data Consistency
-- This migration script fixes existing inconsistent data between user.userType and userSubscription.planId

-- Step 1: Create a function to sync user.userType with userSubscription.planId
CREATE OR REPLACE FUNCTION sync_user_type_with_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user.userType based on the subscription status and planId
    IF NEW.status = 'ACTIVE' THEN
        UPDATE "User" 
        SET "userType" = NEW."planId"
        WHERE id = NEW."userId";
    ELSE
        -- If subscription is not active, set to FREE
        UPDATE "User" 
        SET "userType" = 'FREE'
        WHERE id = NEW."userId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Step 4: Fix existing inconsistent data
-- Update user.userType based on active subscriptions
UPDATE "User" 
SET "userType" = us."planId"
FROM "UserSubscription" us
WHERE "User".id = us."userId" 
AND us.status = 'ACTIVE'
AND "User"."userType" != us."planId";



-- Optional: Run the validation function to check for any remaining inconsistencies
-- SELECT * FROM validate_subscription_consistency() WHERE is_inconsistent = true;
