-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL,
    "userSubscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT DEFAULT 'SYSTEM',
    "stripeEventId" TEXT,
    "metadata" JSONB,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionEvent_stripeEventId_key" ON "SubscriptionEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_userId_idx" ON "SubscriptionEvent"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_userSubscriptionId_idx" ON "SubscriptionEvent"("userSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_effectiveAt_idx" ON "SubscriptionEvent"("effectiveAt");

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
