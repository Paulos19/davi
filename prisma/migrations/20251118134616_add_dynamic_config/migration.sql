-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "dynamicData" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualificationConfig" JSONB;
