/**
 * Magic Scan - Comprehensive Pattern Library
 * Ultra-intelligent regex patterns for detecting sensitive data
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
  maskPattern?: (value: string) => string; // Custom masking
}

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
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
 * Validate JWT structure
 */
function isValidJWT(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Try to decode header and payload
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return !!(header && payload && (header.alg || header.typ));
  } catch {
    return false;
  }
}

/**
 * Comprehensive pattern definitions
 */
export const SCAN_PATTERNS: ScanPattern[] = [
  // ============================================
  // API KEYS & SECRETS (CRITICAL)
  // ============================================
  {
    id: 'aws-access-key',
    category: AssetCategory.API_KEYS,
    type: 'AWS Access Key',
    severity: Severity.CRITICAL,
    patterns: [
      /AKIA[0-9A-Z]{16}/gi,
      /ASIA[0-9A-Z]{16}/gi, // Temporary credentials
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
      /aws[_-]?secret[_-]?access[_-]?key["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    ],
    enabled: true,
    description: 'AWS Secret Access Key detected',
  },
  {
    id: 'github-token',
    category: AssetCategory.API_KEYS,
    type: 'GitHub Token',
    severity: Severity.CRITICAL,
    patterns: [
      /ghp_[A-Za-z0-9]{36}/g, // Personal access token
      /gho_[A-Za-z0-9]{36}/g, // OAuth token
      /ghs_[A-Za-z0-9]{36}/g, // Server-to-server token
      /ghr_[A-Za-z0-9]{36}/g, // Refresh token
    ],
    enabled: true,
    description: 'GitHub personal access token detected',
  },
  {
    id: 'stripe-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Stripe API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /sk_live_[A-Za-z0-9]{24,}/g,
      /sk_test_[A-Za-z0-9]{24,}/g,
      /pk_live_[A-Za-z0-9]{24,}/g,
    ],
    enabled: true,
    description: 'Stripe API key detected',
  },
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
  {
    id: 'twilio-api-key',
    category: AssetCategory.API_KEYS,
    type: 'Twilio API Key',
    severity: Severity.CRITICAL,
    patterns: [
      /SK[a-f0-9]{32}/gi,
      /AC[a-f0-9]{32}/gi, // Account SID
    ],
    enabled: true,
    description: 'Twilio API key/SID detected',
  },
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
      // Must be at least 20 chars and not a common word
      const value = match.replace(/[^A-Za-z0-9_-]/g, '');
      return value.length >= 20 && !/^(test|example|demo|sample)/i.test(value);
    },
    enabled: true,
    description: 'Generic API key pattern detected',
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
    ],
    enabled: true,
    description: 'Redis connection string detected',
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
        return decoded.includes(':'); // username:password format
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
    ],
    enabled: true,
    description: 'Session token detected',
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
    id: 'cloud-metadata-endpoint',
    category: AssetCategory.NETWORK_INFO,
    type: 'Cloud Metadata Endpoint',
    severity: Severity.HIGH,
    patterns: [
      /169\.254\.169\.254/g,
      /metadata\.google\.internal/gi,
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
    ],
    enabled: true,
    description: 'Internal URL detected',
  },

  // ============================================
  // PERSONAL DATA (PII) (MEDIUM)
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
    type: 'Social Security Number',
    severity: Severity.CRITICAL,
    patterns: [
      /\b\d{3}-\d{2}-\d{4}\b/g,
    ],
    enabled: true,
    description: 'Social Security Number detected',
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
    ],
    enabled: true,
    description: 'Git configuration file detected',
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
    ],
    enabled: true,
    description: 'SQL error message detected',
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
