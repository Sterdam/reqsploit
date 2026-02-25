-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('ROOT_CA', 'DOMAIN');

-- CreateEnum
CREATE TYPE "AIMode" AS ENUM ('EDUCATIONAL', 'DEFAULT', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('REQUEST', 'RESPONSE', 'FULL', 'TEST_SUGGESTIONS', 'PAYLOAD_GENERATION', 'DORK_GENERATION', 'ATTACK_CHAIN', 'SECURITY_REPORT');

-- CreateEnum
CREATE TYPE "VulnerabilityType" AS ENUM ('SQLi', 'XSS_REFLECTED', 'XSS_STORED', 'XSS_DOM', 'IDOR', 'SSRF', 'XXE', 'RCE', 'LFI', 'RFI', 'SSTI', 'CSRF', 'CORS_MISCONFIGURATION', 'JWT_WEAK', 'AUTH_BYPASS', 'SESSION_FIXATION', 'PRIVILEGE_ESCALATION', 'INFO_DISCLOSURE', 'COMMAND_INJECTION', 'LDAP_INJECTION', 'XPATH_INJECTION', 'PATH_TRAVERSAL', 'DESERIALIZATION', 'RACE_CONDITION', 'BUSINESS_LOGIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE', 'WONT_FIX');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('API_KEYS', 'PRIVATE_KEYS', 'DATABASE_CREDS', 'AUTH_DATA', 'NETWORK_INFO', 'PII', 'SENSITIVE_FILES', 'ERROR_INFO', 'BUSINESS_LOGIC');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIJobType" AS ENUM ('SUGGEST_TESTS', 'GENERATE_PAYLOADS', 'GENERATE_DORKS', 'ATTACK_CHAIN', 'SECURITY_REPORT', 'ANALYZE_REQUEST', 'ANALYZE_RESPONSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "proxyPort" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "interceptMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proxy_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certPem" TEXT NOT NULL,
    "keyPem" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "domain" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proxySessionId" TEXT NOT NULL,
    "projectId" TEXT,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "body" TEXT,
    "statusCode" INTEGER,
    "responseHeaders" JSONB,
    "responseBody" TEXT,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isIntercepted" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "requestLogId" TEXT,
    "projectId" TEXT,
    "workSessionId" TEXT,
    "analysisType" "AnalysisType" NOT NULL,
    "mode" "AIMode" NOT NULL DEFAULT 'DEFAULT',
    "title" TEXT,
    "category" TEXT,
    "userContext" TEXT,
    "aiResponse" TEXT NOT NULL,
    "suggestions" JSONB NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vulnerabilities" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "type" "VulnerabilityType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "remediation" TEXT NOT NULL,
    "cwe" TEXT,
    "cvss" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "dismissReason" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "vulnerabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "false_positive_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vulnerabilityType" "VulnerabilityType" NOT NULL,
    "pattern" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "false_positive_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "proof" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "tokensLimit" INTEGER NOT NULL,
    "resetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuzzing_campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requestTemplate" JSONB NOT NULL,
    "payloadPositions" JSONB NOT NULL,
    "payloadSets" JSONB NOT NULL,
    "attackType" TEXT NOT NULL,
    "concurrency" INTEGER NOT NULL DEFAULT 5,
    "delayMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "completedRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "fuzzing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuzzing_results" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "payloadSet" JSONB NOT NULL,
    "request" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseLength" INTEGER,
    "responseTime" INTEGER,
    "response" JSONB,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuzzing_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repeater_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repeater_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "severity" "Severity" NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueHash" TEXT NOT NULL,
    "fullValue" TEXT,
    "location" JSONB NOT NULL,
    "context" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "isMarkedSafe" BOOLEAN NOT NULL DEFAULT false,
    "isFalsePositive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" "AssetCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "pattern" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AIJobType" NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "requestData" JSONB NOT NULL,
    "model" TEXT,
    "mode" "AIMode" NOT NULL DEFAULT 'DEFAULT',
    "resultId" TEXT,
    "errorMessage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "totalAnalyses" INTEGER NOT NULL DEFAULT 0,
    "tokensConsumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_plan_idx" ON "users"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_refreshToken_idx" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "proxy_sessions_sessionId_key" ON "proxy_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "proxy_sessions_userId_idx" ON "proxy_sessions"("userId");

-- CreateIndex
CREATE INDEX "proxy_sessions_sessionId_idx" ON "proxy_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "proxy_sessions_isActive_idx" ON "proxy_sessions"("isActive");

-- CreateIndex
CREATE INDEX "certificates_userId_idx" ON "certificates"("userId");

-- CreateIndex
CREATE INDEX "certificates_type_idx" ON "certificates"("type");

-- CreateIndex
CREATE INDEX "certificates_domain_idx" ON "certificates"("domain");

-- CreateIndex
CREATE INDEX "request_logs_userId_idx" ON "request_logs"("userId");

-- CreateIndex
CREATE INDEX "request_logs_proxySessionId_idx" ON "request_logs"("proxySessionId");

-- CreateIndex
CREATE INDEX "request_logs_projectId_idx" ON "request_logs"("projectId");

-- CreateIndex
CREATE INDEX "request_logs_timestamp_idx" ON "request_logs"("timestamp");

-- CreateIndex
CREATE INDEX "request_logs_isIntercepted_idx" ON "request_logs"("isIntercepted");

-- CreateIndex
CREATE INDEX "request_logs_starred_idx" ON "request_logs"("starred");

-- CreateIndex
CREATE INDEX "ai_analyses_requestLogId_idx" ON "ai_analyses"("requestLogId");

-- CreateIndex
CREATE INDEX "ai_analyses_projectId_idx" ON "ai_analyses"("projectId");

-- CreateIndex
CREATE INDEX "ai_analyses_workSessionId_idx" ON "ai_analyses"("workSessionId");

-- CreateIndex
CREATE INDEX "ai_analyses_userId_idx" ON "ai_analyses"("userId");

-- CreateIndex
CREATE INDEX "ai_analyses_analysisType_idx" ON "ai_analyses"("analysisType");

-- CreateIndex
CREATE INDEX "ai_analyses_mode_idx" ON "ai_analyses"("mode");

-- CreateIndex
CREATE INDEX "ai_analyses_createdAt_idx" ON "ai_analyses"("createdAt");

-- CreateIndex
CREATE INDEX "vulnerabilities_analysisId_idx" ON "vulnerabilities"("analysisId");

-- CreateIndex
CREATE INDEX "vulnerabilities_type_idx" ON "vulnerabilities"("type");

-- CreateIndex
CREATE INDEX "vulnerabilities_severity_idx" ON "vulnerabilities"("severity");

-- CreateIndex
CREATE INDEX "vulnerabilities_status_idx" ON "vulnerabilities"("status");

-- CreateIndex
CREATE INDEX "vulnerabilities_dismissedBy_idx" ON "vulnerabilities"("dismissedBy");

-- CreateIndex
CREATE INDEX "false_positive_patterns_userId_idx" ON "false_positive_patterns"("userId");

-- CreateIndex
CREATE INDEX "false_positive_patterns_vulnerabilityType_idx" ON "false_positive_patterns"("vulnerabilityType");

-- CreateIndex
CREATE INDEX "false_positive_patterns_isActive_idx" ON "false_positive_patterns"("isActive");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "projects_target_idx" ON "projects"("target");

-- CreateIndex
CREATE INDEX "findings_projectId_idx" ON "findings"("projectId");

-- CreateIndex
CREATE INDEX "findings_severity_idx" ON "findings"("severity");

-- CreateIndex
CREATE INDEX "findings_status_idx" ON "findings"("status");

-- CreateIndex
CREATE INDEX "token_usage_userId_idx" ON "token_usage"("userId");

-- CreateIndex
CREATE INDEX "token_usage_monthYear_idx" ON "token_usage"("monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "token_usage_userId_monthYear_key" ON "token_usage"("userId", "monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "fuzzing_campaigns_userId_idx" ON "fuzzing_campaigns"("userId");

-- CreateIndex
CREATE INDEX "fuzzing_campaigns_status_idx" ON "fuzzing_campaigns"("status");

-- CreateIndex
CREATE INDEX "fuzzing_campaigns_createdAt_idx" ON "fuzzing_campaigns"("createdAt");

-- CreateIndex
CREATE INDEX "fuzzing_results_campaignId_idx" ON "fuzzing_results"("campaignId");

-- CreateIndex
CREATE INDEX "fuzzing_results_statusCode_idx" ON "fuzzing_results"("statusCode");

-- CreateIndex
CREATE INDEX "fuzzing_results_responseLength_idx" ON "fuzzing_results"("responseLength");

-- CreateIndex
CREATE INDEX "fuzzing_results_responseTime_idx" ON "fuzzing_results"("responseTime");

-- CreateIndex
CREATE INDEX "fuzzing_results_timestamp_idx" ON "fuzzing_results"("timestamp");

-- CreateIndex
CREATE INDEX "repeater_templates_userId_idx" ON "repeater_templates"("userId");

-- CreateIndex
CREATE INDEX "repeater_templates_createdAt_idx" ON "repeater_templates"("createdAt");

-- CreateIndex
CREATE INDEX "scan_results_userId_severity_idx" ON "scan_results"("userId", "severity");

-- CreateIndex
CREATE INDEX "scan_results_userId_category_idx" ON "scan_results"("userId", "category");

-- CreateIndex
CREATE INDEX "scan_results_userId_isMarkedSafe_idx" ON "scan_results"("userId", "isMarkedSafe");

-- CreateIndex
CREATE INDEX "scan_results_valueHash_idx" ON "scan_results"("valueHash");

-- CreateIndex
CREATE INDEX "scan_results_requestId_idx" ON "scan_results"("requestId");

-- CreateIndex
CREATE INDEX "scan_results_createdAt_idx" ON "scan_results"("createdAt");

-- CreateIndex
CREATE INDEX "scan_patterns_userId_enabled_idx" ON "scan_patterns"("userId", "enabled");

-- CreateIndex
CREATE INDEX "scan_patterns_category_idx" ON "scan_patterns"("category");

-- CreateIndex
CREATE INDEX "ai_jobs_userId_status_idx" ON "ai_jobs"("userId", "status");

-- CreateIndex
CREATE INDEX "ai_jobs_status_createdAt_idx" ON "ai_jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_jobs_type_idx" ON "ai_jobs"("type");

-- CreateIndex
CREATE INDEX "ai_jobs_resultId_idx" ON "ai_jobs"("resultId");

-- CreateIndex
CREATE INDEX "work_sessions_userId_isActive_idx" ON "work_sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "work_sessions_projectId_idx" ON "work_sessions"("projectId");

-- CreateIndex
CREATE INDEX "work_sessions_startedAt_idx" ON "work_sessions"("startedAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proxy_sessions" ADD CONSTRAINT "proxy_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_proxySessionId_fkey" FOREIGN KEY ("proxySessionId") REFERENCES "proxy_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_requestLogId_fkey" FOREIGN KEY ("requestLogId") REFERENCES "request_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_workSessionId_fkey" FOREIGN KEY ("workSessionId") REFERENCES "work_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ai_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_dismissedBy_fkey" FOREIGN KEY ("dismissedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "false_positive_patterns" ADD CONSTRAINT "false_positive_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuzzing_campaigns" ADD CONSTRAINT "fuzzing_campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuzzing_results" ADD CONSTRAINT "fuzzing_results_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "fuzzing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repeater_templates" ADD CONSTRAINT "repeater_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "request_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_patterns" ADD CONSTRAINT "scan_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ai_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_sessions" ADD CONSTRAINT "work_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_sessions" ADD CONSTRAINT "work_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
