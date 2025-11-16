import { AIMode } from '@prisma/client';

/**
 * AI & Analysis Types
 */

export interface AIAnalysisRequest {
  requestLogId: string;
  analysisType: AIMode;
  userContext?: string;
  streaming?: boolean;
}

export interface AIAnalysisResult {
  id: string;
  requestLogId: string;
  analysisType: 'request' | 'response' | 'full';
  aiResponse: string;
  vulnerabilities: VulnerabilityInfo[];
  suggestions: AISuggestion[];
  tokensUsed: number;
  confidence: number;
  timestamp: Date | string;
  requestUrl?: string;
  requestMethod?: string;
}

export interface AISuggestion {
  id: string;
  type: 'vulnerability' | 'exploit' | 'modification' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  context: {
    request?: string;
    response?: string;
    relatedRequests?: string[];
  };
  actions: SuggestedAction[];
  confidence: number;
  tokensUsed: number;
}

export interface SuggestedAction {
  label: string;
  type: 'modify' | 'repeat' | 'copy' | 'learn_more';
  payload: {
    modifiedRequest?: HTTPRequestPayload;
    explanation?: string;
    resources?: Link[];
  };
}

export interface HTTPRequestPayload {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface Link {
  title: string;
  url: string;
}

export interface Vulnerability {
  type: VulnerabilityType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
  evidence: string;
  location: string;
  exploitation?: string;
  remediation?: string;
  cvss?: number;
  explanation?: {
    why: string;
    evidence: string[];
    verificationSteps: string[];
  };
  title?: string;
  cwe?: string;
  references?: string[];
}

export type VulnerabilityInfo = Vulnerability;

export interface ExploitPayload {
  name: string;
  type: string;
  payload: string;
  description: string;
  risk: 'safe' | 'moderate' | 'dangerous';
}

export type VulnerabilityType =
  | 'sql_injection'
  | 'xss'
  | 'csrf'
  | 'idor'
  | 'authentication'
  | 'authorization'
  | 'info_disclosure'
  | 'xxe'
  | 'ssrf'
  | 'deserialization'
  | 'security_misconfiguration'
  | 'broken_access_control';

export interface AnalysisContext {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body?: string;
  };
  history?: Array<{
    method: string;
    url: string;
    timestamp: Date;
  }>;
  userContext?: string;
}

export interface TokenUsage {
  userId: string;
  monthYear: string;
  tokensUsed: number;
  tokensLimit: number;
  resetDate: Date;
}

export interface AIStreamChunk {
  type: 'start' | 'chunk' | 'complete' | 'error';
  content?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    confidence?: number;
  };
}
