-- Begin transaction
BEGIN;

WITH users_to_migrate AS (
    -- Find users without active subscriptions
    SELECT u.id as user_id, us.id as subscription_id
    FROM "User" u
    LEFT JOIN "UserSubscription" us ON u.id = us."userId"
    WHERE us.id IS NULL  -- Users with no subscription
       OR us.status NOT IN ('ACTIVE', 'TRIAL')  -- Users with inactive subscriptions
),
updated_subscriptions AS (
    -- Update existing subscriptions
    UPDATE "UserSubscription" us
    SET 
        "planId" = 'FREE',
        status = 'ACTIVE',
        "currentPeriodStart" = CURRENT_TIMESTAMP,
        "currentPeriodEnd" = CURRENT_TIMESTAMP + INTERVAL '1 YEAR',
        "cancelAtPeriodEnd" = false,
        "updatedAt" = CURRENT_TIMESTAMP
    FROM users_to_migrate utm
    WHERE us.id = utm.subscription_id
    RETURNING us."userId"
),
inserted_subscriptions AS (
    -- Create new subscriptions for users without one
    INSERT INTO "UserSubscription" (
        "userId", 
        "planId", 
        status, 
        "currentPeriodStart", 
        "currentPeriodEnd", 
        "createdAt", 
        "updatedAt"
    )
    SELECT 
        utm.user_id,
        'FREE',
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 YEAR',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM users_to_migrate utm
    WHERE utm.subscription_id IS NULL
    RETURNING "userId"
),
reset_users AS (
    -- Reset credits and update user type
    UPDATE "User" u
    SET 
        credits = 5,
        "creditsUsed" = 0,
        "userType" = 'FREE',
        "updatedAt" = CURRENT_TIMESTAMP
    FROM users_to_migrate utm
    WHERE u.id = utm.user_id
    RETURNING u.id, u.email
),
audit_logs AS (
    -- Create audit logs
    INSERT INTO "SubscriptionEvent" (
        "userId",
        "userSubscriptionId",
        "previousStatus",
        "newStatus",
        reason,
        source,
        metadata,
        "createdAt"
    )
    SELECT 
        utm.user_id,
        utm.subscription_id,
        COALESCE((SELECT status FROM "UserSubscription" WHERE id = utm.subscription_id), 'NONE'),
        'ACTIVE',
        'Migrated to FREE plan',
        'SYSTEM',
        jsonb_build_object(
            'migratedAt', CURRENT_TIMESTAMP,
            'previousPlan', COALESCE((SELECT "planId" FROM "UserSubscription" WHERE id = utm.subscription_id), 'NONE'),
            'newPlan', 'FREE'
        ),
        CURRENT_TIMESTAMP
    FROM users_to_migrate utm
)
SELECT format(
    'Migration completed: Updated %s users', 
    (SELECT COUNT(*) FROM users_to_migrate)
);

COMMIT;