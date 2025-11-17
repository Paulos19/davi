-- CreateTable
CREATE TABLE "WaitListEntry" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientBirthDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitListEntry_createdAt_idx" ON "WaitListEntry"("createdAt");
