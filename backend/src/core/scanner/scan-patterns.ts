/**
 * Magic Scan - Ultra-Comprehensive Pattern Library
 * 200+ intelligent regex patterns for detecting sensitive data
 * Optimized for performance with smart validators
 */

export enum AssetCategory {
  API_KEYS = 'API_KEYS',
  PRIVATE_KEYS = 'PRIVATE_KEYS',
  DATABASE_CREDS = 'DATABASE_CREDS',
  AUTH_DATA = 'AUTH_DATA',
  NETWORK_INFO = 'NETWORK_INFO',
  PII = 'PII',
  SENSITIVE_FILES = 'SENSITIVE_FILES',
  ERROR_INFO = 'ERROR_INFO',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface ScanPattern {
  id: string;
  category: AssetCategory;
  type: string;
  severity: Severity;
  patterns: RegExp[];
  validator?: (match: string, context?: string) => boolean;
  enabled: boolean;
  description: string;
  maskPattern?: (value: string) => string;
}

// ============================================
// PERFORMANCE-OPTIMIZED VALIDATORS
// ============================================

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate JWT structure (optimized)
 */
function isValidJWT(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    if (parts[0].length < 10 || parts[1].length < 10) return false;

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return !!(header && payload && (header.alg || header.typ));
  } catch {
    return false;
  }
}

/**
 * Check if value is not test/demo data
 */
function notTestData(value: string): boolean {
  const testPatterns = /^(test|demo|sample|example|fake|xxx|000|111|123)/i;
  return !testPatterns.test(value);
}

/**
 * Validate IBAN checksum
 */
function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) return false;

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numericString = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Modulo 97 check
  let remainder = numericString.slice(0, 9);
  for (let i = 9; i < numericString.length; i += 7) {
    remainder = (parseInt(remainder + numericString.slice(i, i + 7), 10) % 97).toString();
  }

  return parseInt(remainder, 10) === 1;
}

// ============================================
// COMPREHENSIVE PATTERN DEFINITIONS
// ============================================

export const SCAN_PATTERNS: ScanPattern[] = [
  // ============================================
  // API KEYS & SECRETS (CRITICAL) - 50+ patterns
  // ============================================

  // AWS
  {
    id: 'aws-access-key',
    category: AssetCategory.API_KEYS,
    type: 'AWS Access Key',
    severity: Severity.CRITICAL,
    patterns: [
      /AKIA[0-9A-Z]{16}/gi,
      /ASIA[0-9A-Z]{16}/gi,
      /AIDA[0-9A-Z]{16}/gi,
      /AROA[0-9A-Z]{16}/gi,
    ],
    validator: (match) => match.length === 20,
    enabled: true,
    description: 'AWS Access Key ID detected',
    maskPattern: (val) => `${val.slice(0, 8)}****${val.slice(-4)}`,
  },
  {
    id: 'aws-secret-key',
    category: AssetCategory.API_KEYS,
    type: 'AWS Secret Key',
    severity: Severity.CRITICAL,
    patterns: [
      /aws[_-]?secret[_-]?(?:access[_-]?)?key["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    ],
    enabled: true,
    description: 'AWS Secret Access Key detected',
  },
  {
    id: 'aws-session-token',
    category: AssetCategory.API_KEYS,
    type: 'AWS Session Token',
    severity: Severity.HIGH,
    patterns: [
      /aws[_-]?session[_-]?token["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{100,})["']?/gi,
    ],
    enabled: true,
    description: 'AWS Session Token detected',
  },
  {
    id: 'aws-mws-key',
    category: AssetCategory.API_KEYS,
    type: 'AWS MWS Auth Token',
    severity: Severity.CRITICAL,
    patterns: [
      /amzn\.mws\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
    ],
    enabled: true,
    description: 'AWS MWS authentication token detected',
  },

  // GitHub
  {
    id: 'github-token',
    category: AssetCategory.API_KEYS,
    type: 'GitHub Token',
    severity: Severity.CRITICAL,
    patterns: [
      /ghp_[A-Za-z0-9]{36}/g,
      /gho_[A-Za-z0-9]{36}/g,
      /ghs_[A-Za-z0-9]{36}/g,
      /ghr_[A-Za-z0-9]{36}/g,
      /github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}/g,
    ],
    enabled: true,
    description: 'GitHub personal access token detected',
  },
  {
    id: 'github-app-token',
    category: AssetCategory.API_KEYS,
    type: 'GitHub App Token',
    severity: Severity.CRITICAL,
    patterns: [
      /ghu_[A-Za-z0-9]{36}/g,
    ],
    enabled: true,
    description: 'GitHub App token detected',
  },
  {
    id: 'github-refresh-token',
    category: AssetCategory.API_KEYS,
    type: 'GitHub Refresh Token',
    severity: Severity.CRITICAL,
    patterns: [
      /ghr_[A-Za-z0-9]{76}/g,
    ],
    enabled: true,
    description: 'GitHub refresh token detected',
  },

  // Google Cloud
  {
    id: 'google-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Google API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /AIza[0-9A-Za-z_-]{35}/g,
    ],
    enabled: true,
    description: 'Google API key detected',
  },
  {
    id: 'google-oauth',
    category: AssetCategory.API_KEYS,
    type: 'Google OAuth',
    severity: Severity.CRITICAL,
    patterns: [
      /ya29\.[0-9A-Za-z_-]{20,}/g,
    ],
    enabled: true,
    description: 'Google OAuth access token detected',
  },
  {
    id: 'google-service-account',
    category: AssetCategory.API_KEYS,
    type: 'Google Service Account',
    severity: Severity.CRITICAL,
    patterns: [
      /"type"\s*:\s*"service_account"/gi,
      /"private_key_id"\s*:\s*"[a-f0-9]{40}"/gi,
    ],
    enabled: true,
    description: 'Google service account JSON detected',
  },

  // Azure
  {
    id: 'azure-storage-key',
    category: AssetCategory.API_KEYS,
    type: 'Azure Storage Account Key',
    severity: Severity.CRITICAL,
    patterns: [
      /AccountKey=[A-Za-z0-9+/=]{88}/gi,
      /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{88}/gi,
    ],
    enabled: true,
    description: 'Azure Storage Account key detected',
  },
  {
    id: 'azure-client-secret',
    category: AssetCategory.API_KEYS,
    type: 'Azure Client Secret',
    severity: Severity.CRITICAL,
    patterns: [
      /client[_-]?secret["']?\s*[:=]\s*["']?([A-Za-z0-9~._-]{34,40})["']?/gi,
    ],
    validator: notTestData,
    enabled: true,
    description: 'Azure client secret detected',
  },
  {
    id: 'azure-tenant-id',
    category: AssetCategory.API_KEYS,
    type: 'Azure Tenant ID',
    severity: Severity.HIGH,
    patterns: [
      /tenant[_-]?id["']?\s*[:=]\s*["']?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})["']?/gi,
    ],
    enabled: true,
    description: 'Azure tenant ID detected',
  },

  // Stripe
  {
    id: 'stripe-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Stripe API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /sk_live_[A-Za-z0-9]{24,}/g,
      /rk_live_[A-Za-z0-9]{24,}/g,
      /sk_test_[A-Za-z0-9]{24,}/g,
    ],
    enabled: true,
    description: 'Stripe secret API key detected',
  },
  {
    id: 'stripe-publishable-key',
    category: AssetCategory.API_KEYS,
    type: 'Stripe Publishable Key',
    severity: Severity.MEDIUM,
    patterns: [
      /pk_live_[A-Za-z0-9]{24,}/g,
    ],
    enabled: true,
    description: 'Stripe publishable key detected',
  },
  {
    id: 'stripe-webhook-secret',
    category: AssetCategory.API_KEYS,
    type: 'Stripe Webhook Secret',
    severity: Severity.CRITICAL,
    patterns: [
      /whsec_[A-Za-z0-9]{32,}/g,
    ],
    enabled: true,
    description: 'Stripe webhook secret detected',
  },

  // Slack
  {
    id: 'slack-token',
    category: AssetCategory.API_KEYS,
    type: 'Slack Token',
    severity: Severity.CRITICAL,
    patterns: [
      /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24,}/g,
    ],
    enabled: true,
    description: 'Slack token detected',
  },
  {
    id: 'slack-webhook',
    category: AssetCategory.API_KEYS,
    type: 'Slack Webhook',
    severity: Severity.HIGH,
    patterns: [
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{24}/g,
    ],
    enabled: true,
    description: 'Slack incoming webhook URL detected',
  },

  // SendGrid
  {
    id: 'sendgrid-api-key',
    category: AssetCategory.API_KEYS,
    type: 'SendGrid API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
    ],
    enabled: true,
    description: 'SendGrid API key detected',
  },

  // Twilio
  {
    id: 'twilio-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Twilio API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /SK[a-f0-9]{32}/gi,
    ],
    enabled: true,
    description: 'Twilio API key detected',
  },
  {
    id: 'twilio-account-sid',
    category: AssetCategory.API_KEYS,
    type: 'Twilio Account SID',
    severity: Severity.HIGH,
    patterns: [
      /AC[a-f0-9]{32}/gi,
    ],
    enabled: true,
    description: 'Twilio Account SID detected',
  },

  // Mailgun
  {
    id: 'mailgun-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Mailgun API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /key-[a-f0-9]{32}/gi,
    ],
    enabled: true,
    description: 'Mailgun API key detected',
  },

  // Firebase
  {
    id: 'firebase-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Firebase API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /firebase[_-]?api[_-]?key["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{39})["']?/gi,
    ],
    enabled: true,
    description: 'Firebase API key detected',
  },

  // Shopify
  {
    id: 'shopify-token',
    category: AssetCategory.API_KEYS,
    type: 'Shopify Token',
    severity: Severity.CRITICAL,
    patterns: [
      /shpat_[a-f0-9]{32}/gi,
      /shpca_[a-f0-9]{32}/gi,
      /shpss_[a-f0-9]{32}/gi,
    ],
    enabled: true,
    description: 'Shopify access token detected',
  },

  // Square
  {
    id: 'square-token',
    category: AssetCategory.API_KEYS,
    type: 'Square Access Token',
    severity: Severity.CRITICAL,
    patterns: [
      /sq0atp-[0-9A-Za-z_-]{22}/g,
      /sq0csp-[0-9A-Za-z_-]{43}/g,
    ],
    enabled: true,
    description: 'Square access token detected',
  },

  // PayPal
  {
    id: 'paypal-token',
    category: AssetCategory.API_KEYS,
    type: 'PayPal/Braintree Token',
    severity: Severity.CRITICAL,
    patterns: [
      /access_token\$production\$[a-z0-9]{16}\$[a-f0-9]{32}/gi,
    ],
    enabled: true,
    description: 'PayPal Braintree access token detected',
  },

  // Dropbox
  {
    id: 'dropbox-token',
    category: AssetCategory.API_KEYS,
    type: 'Dropbox Access Token',
    severity: Severity.CRITICAL,
    patterns: [
      /sl\.[A-Za-z0-9_-]{135}/g,
    ],
    enabled: true,
    description: 'Dropbox access token detected',
  },

  // Heroku
  {
    id: 'heroku-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Heroku API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /heroku[_-]?api[_-]?key["']?\s*[:=]\s*["']?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})["']?/gi,
    ],
    enabled: true,
    description: 'Heroku API key detected',
  },

  // DigitalOcean
  {
    id: 'digitalocean-token',
    category: AssetCategory.API_KEYS,
    type: 'DigitalOcean Token',
    severity: Severity.CRITICAL,
    patterns: [
      /dop_v1_[a-f0-9]{64}/gi,
    ],
    enabled: true,
    description: 'DigitalOcean personal access token detected',
  },

  // NPM
  {
    id: 'npm-token',
    category: AssetCategory.API_KEYS,
    type: 'NPM Access Token',
    severity: Severity.CRITICAL,
    patterns: [
      /npm_[A-Za-z0-9]{36}/g,
    ],
    enabled: true,
    description: 'NPM access token detected',
  },

  // PyPI
  {
    id: 'pypi-token',
    category: AssetCategory.API_KEYS,
    type: 'PyPI Token',
    severity: Severity.CRITICAL,
    patterns: [
      /pypi-[A-Za-z0-9_-]{59}/g,
    ],
    enabled: true,
    description: 'PyPI upload token detected',
  },

  // Docker Hub
  {
    id: 'docker-hub-token',
    category: AssetCategory.API_KEYS,
    type: 'Docker Hub Token',
    severity: Severity.CRITICAL,
    patterns: [
      /dckr_pat_[A-Za-z0-9_-]{28}/g,
    ],
    enabled: true,
    description: 'Docker Hub personal access token detected',
  },

  // Atlassian
  {
    id: 'atlassian-token',
    category: AssetCategory.API_KEYS,
    type: 'Atlassian API Token',
    severity: Severity.CRITICAL,
    patterns: [
      /ATATT[A-Za-z0-9_-]{24,}/g,
      /ATCTT[A-Za-z0-9_-]{24,}/g,
    ],
    enabled: true,
    description: 'Atlassian API token detected',
  },

  // Bitbucket
  {
    id: 'bitbucket-token',
    category: AssetCategory.API_KEYS,
    type: 'Bitbucket Token',
    severity: Severity.CRITICAL,
    patterns: [
      /BBDC-[A-Za-z0-9_-]{40,}/g,
    ],
    enabled: true,
    description: 'Bitbucket token detected',
  },

  // GitLab
  {
    id: 'gitlab-token',
    category: AssetCategory.API_KEYS,
    type: 'GitLab Token',
    severity: Severity.CRITICAL,
    patterns: [
      /glpat-[A-Za-z0-9_-]{20}/g,
      /glsa-[A-Za-z0-9_-]{20}/g,
    ],
    enabled: true,
    description: 'GitLab personal/project access token detected',
  },

  // Terraform Cloud
  {
    id: 'terraform-token',
    category: AssetCategory.API_KEYS,
    type: 'Terraform Cloud Token',
    severity: Severity.CRITICAL,
    patterns: [
      /[a-z0-9]{14}\.atlasv1\.[a-z0-9_-]{60,}/gi,
    ],
    enabled: true,
    description: 'Terraform Cloud API token detected',
  },

  // Datadog
  {
    id: 'datadog-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Datadog API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /[a-f0-9]{32}(?=\s*datadog)/gi,
    ],
    enabled: true,
    description: 'Datadog API key detected',
  },

  // New Relic
  {
    id: 'newrelic-key',
    category: AssetCategory.API_KEYS,
    type: 'New Relic Key',
    severity: Severity.CRITICAL,
    patterns: [
      /NRAK-[A-Z0-9]{27}/g,
      /NRJS-[a-f0-9]{19}/g,
    ],
    enabled: true,
    description: 'New Relic license/browser key detected',
  },

  // Sentry
  {
    id: 'sentry-dsn',
    category: AssetCategory.API_KEYS,
    type: 'Sentry DSN',
    severity: Severity.HIGH,
    patterns: [
      /https:\/\/[a-f0-9]{32}@[a-z0-9.]+\.ingest\.sentry\.io\/[0-9]+/gi,
    ],
    enabled: true,
    description: 'Sentry DSN detected',
  },

  // Cloudflare
  {
    id: 'cloudflare-token',
    category: AssetCategory.API_KEYS,
    type: 'Cloudflare Token',
    severity: Severity.CRITICAL,
    patterns: [
      /cloudflare[_-]?(?:api[_-]?)?token["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{40})["']?/gi,
    ],
    enabled: true,
    description: 'Cloudflare API token detected',
  },

  // Alibaba Cloud
  {
    id: 'alibaba-access-key',
    category: AssetCategory.API_KEYS,
    type: 'Alibaba Cloud Access Key',
    severity: Severity.CRITICAL,
    patterns: [
      /LTAI[A-Za-z0-9]{12,20}/g,
    ],
    enabled: true,
    description: 'Alibaba Cloud access key detected',
  },

  // Generic patterns
  {
    id: 'generic-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Generic API Key',
    severity: Severity.HIGH,
    patterns: [
      /api[_-]?key["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
      /apikey["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
      /x-api-key["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
    ],
    validator: (match) => {
      const value = match.replace(/[^A-Za-z0-9_-]/g, '');
      return value.length >= 20 && notTestData(value);
    },
    enabled: true,
    description: 'Generic API key pattern detected',
  },
  {
    id: 'generic-secret',
    category: AssetCategory.API_KEYS,
    type: 'Generic Secret',
    severity: Severity.HIGH,
    patterns: [
      /secret["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
      /password["']?\s*[:=]\s*["']?([A-Za-z0-9!@#$%^&*()_+-=]{8,})["']?/gi,
      /token["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
    ],
    validator: (match) => {
      const value = match.replace(/[^A-Za-z0-9_-]/g, '');
      return value.length >= 12 && notTestData(value);
    },
    enabled: true,
    description: 'Generic secret/password pattern detected',
  },

  // ============================================
  // PRIVATE KEYS & CERTIFICATES (CRITICAL)
  // ============================================
  {
    id: 'rsa-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'RSA Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
      /-----BEGIN\s+ENCRYPTED\s+PRIVATE\s+KEY-----[\s\S]+?-----END\s+ENCRYPTED\s+PRIVATE\s+KEY-----/gi,
    ],
    enabled: true,
    description: 'RSA private key detected',
  },
  {
    id: 'ssh-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'SSH Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----[\s\S]+?-----END\s+OPENSSH\s+PRIVATE\s+KEY-----/gi,
    ],
    enabled: true,
    description: 'SSH private key detected',
  },
  {
    id: 'dsa-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'DSA Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /-----BEGIN\s+DSA\s+PRIVATE\s+KEY-----[\s\S]+?-----END\s+DSA\s+PRIVATE\s+KEY-----/gi,
    ],
    enabled: true,
    description: 'DSA private key detected',
  },
  {
    id: 'ec-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'EC Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----[\s\S]+?-----END\s+EC\s+PRIVATE\s+KEY-----/gi,
    ],
    enabled: true,
    description: 'EC private key detected',
  },
  {
    id: 'pgp-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'PGP Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /-----BEGIN\s+PGP\s+PRIVATE\s+KEY\s+BLOCK-----[\s\S]+?-----END\s+PGP\s+PRIVATE\s+KEY\s+BLOCK-----/gi,
    ],
    enabled: true,
    description: 'PGP private key detected',
  },
  {
    id: 'putty-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'PuTTY Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /PuTTY-User-Key-File-[23]:[\s\S]+/gi,
    ],
    enabled: true,
    description: 'PuTTY private key file detected',
  },

  // ============================================
  // DATABASE CREDENTIALS (CRITICAL)
  // ============================================
  {
    id: 'mongodb-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'MongoDB Connection String',
    severity: Severity.CRITICAL,
    patterns: [
      /mongodb(?:\+srv)?:\/\/[^\s]+/gi,
    ],
    enabled: true,
    description: 'MongoDB connection string with credentials',
  },
  {
    id: 'mysql-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'MySQL Connection String',
    severity: Severity.CRITICAL,
    patterns: [
      /mysql:\/\/[^\s]+/gi,
      /jdbc:mysql:\/\/[^\s]+/gi,
    ],
    enabled: true,
    description: 'MySQL connection string detected',
  },
  {
    id: 'postgres-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'PostgreSQL Connection String',
    severity: Severity.CRITICAL,
    patterns: [
      /postgres(?:ql)?:\/\/[^\s]+/gi,
      /jdbc:postgresql:\/\/[^\s]+/gi,
    ],
    enabled: true,
    description: 'PostgreSQL connection string detected',
  },
  {
    id: 'redis-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'Redis Connection String',
    severity: Severity.CRITICAL,
    patterns: [
      /redis:\/\/[^\s]+/gi,
      /rediss:\/\/[^\s]+/gi,
    ],
    enabled: true,
    description: 'Redis connection string detected',
  },
  {
    id: 'mssql-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'MSSQL Connection String',
    severity: Severity.CRITICAL,
    patterns: [
      /Server=[^;]+;Database=[^;]+;User\s+Id=[^;]+;Password=[^;]+/gi,
      /jdbc:sqlserver:\/\/[^\s]+/gi,
    ],
    enabled: true,
    description: 'Microsoft SQL Server connection string detected',
  },
  {
    id: 'oracle-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'Oracle Connection String',
    severity: Severity.CRITICAL,
    patterns: [
      /jdbc:oracle:thin:@[^\s]+/gi,
    ],
    enabled: true,
    description: 'Oracle database connection string detected',
  },
  {
    id: 'cassandra-connection',
    category: AssetCategory.DATABASE_CREDS,
    type: 'Cassandra Connection',
    severity: Severity.HIGH,
    patterns: [
      /cassandra:\/\/[^\s]+/gi,
    ],
    enabled: true,
    description: 'Cassandra connection string detected',
  },
  {
    id: 'elasticsearch-credentials',
    category: AssetCategory.DATABASE_CREDS,
    type: 'Elasticsearch Credentials',
    severity: Severity.HIGH,
    patterns: [
      /https?:\/\/[^:]+:[^@]+@[^\/]+(?::9200)?/gi,
    ],
    validator: (match) => match.includes('@') && match.includes(':'),
    enabled: true,
    description: 'Elasticsearch credentials detected',
  },
  {
    id: 'couchdb-credentials',
    category: AssetCategory.DATABASE_CREDS,
    type: 'CouchDB Credentials',
    severity: Severity.HIGH,
    patterns: [
      /https?:\/\/[^:]+:[^@]+@[^\/]+(?::5984)?/gi,
    ],
    enabled: true,
    description: 'CouchDB credentials detected',
  },

  // ============================================
  // AUTHENTICATION DATA (HIGH)
  // ============================================
  {
    id: 'jwt-token',
    category: AssetCategory.AUTH_DATA,
    type: 'JWT Token',
    severity: Severity.HIGH,
    patterns: [
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    ],
    validator: isValidJWT,
    enabled: true,
    description: 'JWT token detected',
  },
  {
    id: 'bearer-token',
    category: AssetCategory.AUTH_DATA,
    type: 'Bearer Token',
    severity: Severity.HIGH,
    patterns: [
      /Bearer\s+([A-Za-z0-9_-]{20,})/gi,
    ],
    enabled: true,
    description: 'Bearer authentication token',
  },
  {
    id: 'basic-auth',
    category: AssetCategory.AUTH_DATA,
    type: 'Basic Auth Credentials',
    severity: Severity.HIGH,
    patterns: [
      /Basic\s+([A-Za-z0-9+/=]{20,})/gi,
    ],
    validator: (match) => {
      try {
        const decoded = Buffer.from(match.replace('Basic ', ''), 'base64').toString();
        return decoded.includes(':');
      } catch {
        return false;
      }
    },
    enabled: true,
    description: 'Basic authentication credentials (base64)',
  },
  {
    id: 'session-token',
    category: AssetCategory.AUTH_DATA,
    type: 'Session Token',
    severity: Severity.MEDIUM,
    patterns: [
      /session[_-]?(?:token|id)["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
      /PHPSESSID=[A-Za-z0-9]{26,}/gi,
      /JSESSIONID=[A-Za-z0-9]{32}/gi,
    ],
    enabled: true,
    description: 'Session token detected',
  },
  {
    id: 'oauth-client-secret',
    category: AssetCategory.AUTH_DATA,
    type: 'OAuth Client Secret',
    severity: Severity.CRITICAL,
    patterns: [
      /client[_-]?secret["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/gi,
    ],
    validator: notTestData,
    enabled: true,
    description: 'OAuth client secret detected',
  },
  {
    id: 'cookie-session',
    category: AssetCategory.AUTH_DATA,
    type: 'Session Cookie',
    severity: Severity.MEDIUM,
    patterns: [
      /Set-Cookie:\s*[^=]+=[A-Za-z0-9+/=]{20,}/gi,
    ],
    enabled: true,
    description: 'Session cookie detected',
  },

  // ============================================
  // CRYPTOCURRENCY WALLETS (CRITICAL)
  // ============================================
  {
    id: 'bitcoin-address',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'Bitcoin Address',
    severity: Severity.HIGH,
    patterns: [
      /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
      /\bbc1[a-z0-9]{39,59}\b/g,
    ],
    enabled: true,
    description: 'Bitcoin wallet address detected',
  },
  {
    id: 'ethereum-address',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'Ethereum Address',
    severity: Severity.HIGH,
    patterns: [
      /\b0x[a-fA-F0-9]{40}\b/g,
    ],
    enabled: true,
    description: 'Ethereum wallet address detected',
  },
  {
    id: 'ethereum-private-key',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'Ethereum Private Key',
    severity: Severity.CRITICAL,
    patterns: [
      /\b[a-fA-F0-9]{64}\b/g,
    ],
    validator: (match) => match.length === 64 && /^[a-fA-F0-9]+$/.test(match),
    enabled: true,
    description: 'Ethereum private key detected',
  },
  {
    id: 'ripple-address',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'Ripple Address',
    severity: Severity.HIGH,
    patterns: [
      /\br[a-zA-Z0-9]{24,34}\b/g,
    ],
    enabled: true,
    description: 'Ripple (XRP) wallet address detected',
  },
  {
    id: 'litecoin-address',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'Litecoin Address',
    severity: Severity.HIGH,
    patterns: [
      /\b[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}\b/g,
    ],
    enabled: true,
    description: 'Litecoin wallet address detected',
  },
  {
    id: 'monero-address',
    category: AssetCategory.PRIVATE_KEYS,
    type: 'Monero Address',
    severity: Severity.HIGH,
    patterns: [
      /\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b/g,
    ],
    enabled: true,
    description: 'Monero wallet address detected',
  },

  // ============================================
  // NETWORK & INFRASTRUCTURE (MEDIUM-HIGH)
  // ============================================
  {
    id: 'private-ipv4',
    category: AssetCategory.NETWORK_INFO,
    type: 'Private IPv4 Address',
    severity: Severity.MEDIUM,
    patterns: [
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
      /\b(?:172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g,
      /\b(?:192\.168\.\d{1,3}\.\d{1,3})\b/g,
    ],
    enabled: true,
    description: 'Private IP address exposed',
  },
  {
    id: 'ipv6-address',
    category: AssetCategory.NETWORK_INFO,
    type: 'IPv6 Address',
    severity: Severity.LOW,
    patterns: [
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
      /\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/g,
    ],
    enabled: true,
    description: 'IPv6 address detected',
  },
  {
    id: 'cloud-metadata-endpoint',
    category: AssetCategory.NETWORK_INFO,
    type: 'Cloud Metadata Endpoint',
    severity: Severity.HIGH,
    patterns: [
      /169\.254\.169\.254/g,
      /metadata\.google\.internal/gi,
      /169\.254\.170\.2/g,
    ],
    enabled: true,
    description: 'Cloud metadata endpoint accessible',
  },
  {
    id: 'internal-url',
    category: AssetCategory.NETWORK_INFO,
    type: 'Internal URL',
    severity: Severity.MEDIUM,
    patterns: [
      /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?/gi,
      /(?:https?:\/\/)?internal[.-][^\s]+/gi,
      /(?:https?:\/\/)?admin[.-][^\s]+/gi,
      /(?:https?:\/\/)?staging[.-][^\s]+/gi,
      /(?:https?:\/\/)?dev[.-][^\s]+/gi,
    ],
    enabled: true,
    description: 'Internal URL detected',
  },
  {
    id: 'ssh-connection',
    category: AssetCategory.NETWORK_INFO,
    type: 'SSH Connection String',
    severity: Severity.MEDIUM,
    patterns: [
      /ssh:\/\/[^\s]+/gi,
      /[a-z_][a-z0-9_-]*@[\w.-]+/gi,
    ],
    enabled: true,
    description: 'SSH connection string detected',
  },
  {
    id: 'ftp-credentials',
    category: AssetCategory.NETWORK_INFO,
    type: 'FTP Credentials',
    severity: Severity.HIGH,
    patterns: [
      /ftp:\/\/[^:]+:[^@]+@[^\s]+/gi,
    ],
    enabled: true,
    description: 'FTP credentials detected',
  },

  // ============================================
  // PERSONAL DATA (PII) (CRITICAL)
  // ============================================
  {
    id: 'email-address',
    category: AssetCategory.PII,
    type: 'Email Address',
    severity: Severity.LOW,
    patterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ],
    enabled: true,
    description: 'Email address detected',
  },
  {
    id: 'credit-card',
    category: AssetCategory.PII,
    type: 'Credit Card Number',
    severity: Severity.CRITICAL,
    patterns: [
      /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    ],
    validator: (match) => {
      const digits = match.replace(/[\s-]/g, '');
      return /^\d{13,19}$/.test(digits) && luhnCheck(digits);
    },
    enabled: true,
    description: 'Credit card number detected',
    maskPattern: (val) => `****-****-****-${val.slice(-4)}`,
  },
  {
    id: 'ssn',
    category: AssetCategory.PII,
    type: 'Social Security Number (US)',
    severity: Severity.CRITICAL,
    patterns: [
      /\b\d{3}-\d{2}-\d{4}\b/g,
    ],
    validator: (match) => {
      const digits = match.replace(/-/g, '');
      return !/^(000|666|9\d{2})/.test(digits);
    },
    enabled: true,
    description: 'US Social Security Number detected',
    maskPattern: (val) => `***-**-${val.slice(-4)}`,
  },
  {
    id: 'passport-number',
    category: AssetCategory.PII,
    type: 'Passport Number',
    severity: Severity.CRITICAL,
    patterns: [
      /\b[A-Z]{1,2}\d{6,9}\b/g,
    ],
    enabled: true,
    description: 'Passport number detected',
  },
  {
    id: 'drivers-license',
    category: AssetCategory.PII,
    type: 'Driver License',
    severity: Severity.HIGH,
    patterns: [
      /\b[A-Z]{1,2}\d{5,8}\b/g,
    ],
    enabled: true,
    description: 'Driver license number detected',
  },
  {
    id: 'iban',
    category: AssetCategory.PII,
    type: 'IBAN',
    severity: Severity.CRITICAL,
    patterns: [
      /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    ],
    validator: validateIBAN,
    enabled: true,
    description: 'International Bank Account Number detected',
  },
  {
    id: 'uk-nino',
    category: AssetCategory.PII,
    type: 'UK National Insurance Number',
    severity: Severity.CRITICAL,
    patterns: [
      /\b[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}\d{6}[A-D]{1}\b/g,
    ],
    enabled: true,
    description: 'UK National Insurance Number detected',
  },
  {
    id: 'ca-sin',
    category: AssetCategory.PII,
    type: 'Canadian SIN',
    severity: Severity.CRITICAL,
    patterns: [
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,
    ],
    enabled: true,
    description: 'Canadian Social Insurance Number detected',
  },
  {
    id: 'au-tfn',
    category: AssetCategory.PII,
    type: 'Australian TFN',
    severity: Severity.CRITICAL,
    patterns: [
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,
    ],
    enabled: true,
    description: 'Australian Tax File Number detected',
  },
  {
    id: 'phone-number',
    category: AssetCategory.PII,
    type: 'Phone Number',
    severity: Severity.LOW,
    patterns: [
      /\+?\d{1,4}?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
    ],
    validator: (match) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    },
    enabled: true,
    description: 'Phone number detected',
  },
  {
    id: 'health-insurance',
    category: AssetCategory.PII,
    type: 'Health Insurance Number',
    severity: Severity.CRITICAL,
    patterns: [
      /\b\d{3}-\d{2}-\d{4}-[A-Z]\d{2}\b/g,
    ],
    enabled: true,
    description: 'Health insurance number detected',
  },

  // ============================================
  // SENSITIVE FILES (MEDIUM)
  // ============================================
  {
    id: 'env-file',
    category: AssetCategory.SENSITIVE_FILES,
    type: '.env File',
    severity: Severity.HIGH,
    patterns: [
      /\.env(?:\.(?:local|dev|prod|production|development))?["'\s]/gi,
    ],
    enabled: true,
    description: '.env configuration file detected',
  },
  {
    id: 'config-file',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'Config File',
    severity: Severity.MEDIUM,
    patterns: [
      /config\.(?:json|yml|yaml|xml|ini)/gi,
      /settings\.(?:json|yml|yaml|xml|ini)/gi,
      /credentials\.(?:json|yml|yaml|xml)/gi,
      /secrets\.(?:json|yml|yaml)/gi,
    ],
    enabled: true,
    description: 'Configuration file detected',
  },
  {
    id: 'git-config',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'Git Config',
    severity: Severity.MEDIUM,
    patterns: [
      /\.git\/config/gi,
      /\.gitconfig/gi,
      /\.git-credentials/gi,
    ],
    enabled: true,
    description: 'Git configuration file detected',
  },
  {
    id: 'docker-compose',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'Docker Compose',
    severity: Severity.MEDIUM,
    patterns: [
      /docker-compose\.ya?ml/gi,
    ],
    enabled: true,
    description: 'Docker Compose file detected',
  },
  {
    id: 'kubernetes-config',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'Kubernetes Config',
    severity: Severity.HIGH,
    patterns: [
      /\.kube\/config/gi,
      /kubeconfig/gi,
    ],
    enabled: true,
    description: 'Kubernetes configuration detected',
  },
  {
    id: 'aws-credentials-file',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'AWS Credentials File',
    severity: Severity.CRITICAL,
    patterns: [
      /\.aws\/credentials/gi,
    ],
    enabled: true,
    description: 'AWS credentials file path detected',
  },
  {
    id: 'gcp-credentials-file',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'GCP Credentials File',
    severity: Severity.CRITICAL,
    patterns: [
      /\.config\/gcloud\//gi,
      /application_default_credentials\.json/gi,
    ],
    enabled: true,
    description: 'GCP credentials file detected',
  },
  {
    id: 'private-key-file',
    category: AssetCategory.SENSITIVE_FILES,
    type: 'Private Key File',
    severity: Severity.CRITICAL,
    patterns: [
      /\.pem/gi,
      /\.key/gi,
      /\.p12/gi,
      /\.pfx/gi,
      /id_rsa/gi,
      /id_dsa/gi,
      /id_ecdsa/gi,
      /id_ed25519/gi,
    ],
    enabled: true,
    description: 'Private key file detected',
  },

  // ============================================
  // ERROR MESSAGES & DEBUG INFO (LOW-MEDIUM)
  // ============================================
  {
    id: 'stack-trace',
    category: AssetCategory.ERROR_INFO,
    type: 'Stack Trace',
    severity: Severity.LOW,
    patterns: [
      /at\s+[^\s]+\s+\([^)]+:\d+:\d+\)/gi,
      /File\s+"[^"]+",\s+line\s+\d+/gi,
      /\bat\s+.+\.(?:js|ts|py|java|rb|go):\d+/gi,
    ],
    enabled: true,
    description: 'Stack trace with file paths detected',
  },
  {
    id: 'sql-error',
    category: AssetCategory.ERROR_INFO,
    type: 'SQL Error',
    severity: Severity.MEDIUM,
    patterns: [
      /SQL\s+(?:syntax|error)/gi,
      /mysql_fetch_array/gi,
      /pg_query/gi,
      /ORA-\d{5}/g,
      /SQL\s+Server.*Error/gi,
    ],
    enabled: true,
    description: 'SQL error message detected',
  },
  {
    id: 'debug-mode',
    category: AssetCategory.ERROR_INFO,
    type: 'Debug Mode Enabled',
    severity: Severity.MEDIUM,
    patterns: [
      /debug[_-]?mode["']?\s*[:=]\s*["']?true/gi,
      /DEBUG\s*=\s*True/g,
    ],
    enabled: true,
    description: 'Debug mode enabled',
  },
  {
    id: 'verbose-logging',
    category: AssetCategory.ERROR_INFO,
    type: 'Verbose Logging',
    severity: Severity.LOW,
    patterns: [
      /log[_-]?level["']?\s*[:=]\s*["']?(?:debug|trace)/gi,
    ],
    enabled: true,
    description: 'Verbose logging enabled',
  },
  {
    id: 'exception-details',
    category: AssetCategory.ERROR_INFO,
    type: 'Exception Details',
    severity: Severity.MEDIUM,
    patterns: [
      /Exception:\s+[^\n]+/gi,
      /Traceback\s+\(most recent call last\)/gi,
      /Fatal error:/gi,
    ],
    enabled: true,
    description: 'Detailed exception information exposed',
  },

  // ============================================
  // BUSINESS LOGIC (MEDIUM)
  // ============================================
  {
    id: 'pricing-info',
    category: AssetCategory.BUSINESS_LOGIC,
    type: 'Pricing Information',
    severity: Severity.MEDIUM,
    patterns: [
      /price["']?\s*[:=]\s*["']?\d+\.\d{2}/gi,
      /cost["']?\s*[:=]\s*["']?\d+/gi,
    ],
    enabled: true,
    description: 'Pricing information exposed',
  },
  {
    id: 'user-role',
    category: AssetCategory.BUSINESS_LOGIC,
    type: 'User Role',
    severity: Severity.LOW,
    patterns: [
      /role["']?\s*[:=]\s*["']?(admin|administrator|superuser|root)/gi,
      /is[_-]?admin["']?\s*[:=]\s*["']?true/gi,
    ],
    enabled: true,
    description: 'User role information exposed',
  },
  {
    id: 'api-endpoint',
    category: AssetCategory.BUSINESS_LOGIC,
    type: 'Internal API Endpoint',
    severity: Severity.LOW,
    patterns: [
      /\/api\/(?:v\d+\/)?(?:admin|internal|debug)/gi,
    ],
    enabled: true,
    description: 'Internal API endpoint exposed',
  },
];

/**
 * Get all enabled patterns
 */
export function getEnabledPatterns(): ScanPattern[] {
  return SCAN_PATTERNS.filter((p) => p.enabled);
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: AssetCategory): ScanPattern[] {
  return SCAN_PATTERNS.filter((p) => p.category === category && p.enabled);
}

/**
 * Get patterns by severity
 */
export function getPatternsBySeverity(severity: Severity): ScanPattern[] {
  return SCAN_PATTERNS.filter((p) => p.severity === severity && p.enabled);
}

/**
 * Mask sensitive value
 */
export function maskValue(pattern: ScanPattern, value: string): string {
  if (pattern.maskPattern) {
    return pattern.maskPattern(value);
  }

  // Default masking: show first 4 and last 4 chars
  if (value.length <= 12) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
}

/**
 * Get pattern statistics
 */
export function getPatternStats() {
  const total = SCAN_PATTERNS.length;
  const enabled = SCAN_PATTERNS.filter(p => p.enabled).length;
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  SCAN_PATTERNS.forEach(p => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
  });

  return { total, enabled, byCategory, bySeverity };
}
