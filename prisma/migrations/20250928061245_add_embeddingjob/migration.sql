-- CreateTable
CREATE TABLE "EmbeddingJob" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "payload" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmbeddingJob_status_idx" ON "EmbeddingJob"("status");

-- CreateIndex
CREATE INDEX "EmbeddingJob_createdAt_idx" ON "EmbeddingJob"("createdAt");
