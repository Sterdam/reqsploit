-- Add CDP columns to proxy_sessions
ALTER TABLE "proxy_sessions" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'cdp';
ALTER TABLE "proxy_sessions" ADD COLUMN IF NOT EXISTS "extensionVersion" TEXT;

-- Make proxyPort nullable (CDP mode doesn't use ports)
ALTER TABLE "proxy_sessions" ALTER COLUMN "proxyPort" DROP NOT NULL;
