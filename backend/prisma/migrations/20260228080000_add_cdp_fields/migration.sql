-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN IF NOT EXISTS "tabId" INTEGER;
ALTER TABLE "request_logs" ADD COLUMN IF NOT EXISTS "resourceType" TEXT;
