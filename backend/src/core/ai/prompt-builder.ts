/**
 * Advanced AI Prompt Builder
 *
 * Builds intelligent, context-aware prompts for the 3 AI modes:
 * - EDUCATIONAL: Detailed explanations for learning
 * - DEFAULT: Fast, actionable pentesting
 * - ADVANCED: Expert-level technical analysis
 */

import { AIMode } from '@prisma/client';

export interface RequestContext {
  method: string;
  url: string;
  headers: Record<string, any>;
  body?: string;
  statusCode?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: string;
  duration?: number;
}

export interface RelatedRequest {
  method: string;
  url: string;
  timestamp: Date;
  statusCode?: number;
}

export interface ApplicationContext {
  technology?: string[];
  authentication?: string;
  sessionType?: string;
  apiEndpoints?: string[];
}

export class PromptBuilder {
  /**
   * Get system prompt based on AI mode
   */
  static getSystemPrompt(mode: AIMode): string {
    const prompts = {
      EDUCATIONAL: `You are an expert web security mentor and educator. Your mission is to teach and empower security researchers.

ANALYSIS APPROACH:
1. EXPLAIN THE WHY - Root cause and security principles violated
2. SHOW THE HOW - Technical mechanism and attack flow
3. ASSESS THE IMPACT - Business and technical risks (CVSS scoring)
4. DEMONSTRATE EXPLOITATION - Step-by-step with ethical context
5. TEACH REMEDIATION - Secure coding practices and fixes
6. PROVIDE RESOURCES - Documentation, CVEs, learning materials

OUTPUT REQUIREMENTS:
- Use clear, educational language with examples
- Include code snippets for demonstration
- Reference OWASP Top 10, CWE, CVE when applicable
- Provide multiple test cases and variations
- Explain security concepts thoroughly
- Add learning resources and next steps

TONE: Patient, thorough, educational, empowering`,

      DEFAULT: `You are a professional pentesting AI assistant. Provide fast, actionable security analysis.

ANALYSIS APPROACH:
1. DETECT - Identify vulnerabilities with severity levels
2. EXPLOIT - Provide ready-to-use payloads and PoC
3. PRIORITIZE - Rank findings by risk and exploitability
4. RECOMMEND - Give actionable remediation steps

OUTPUT REQUIREMENTS:
- Be concise and direct
- Focus on exploitable vulnerabilities
- Provide working payloads immediately
- Include CVSS scores and severity
- Suggest next testing steps
- Format for copy-paste usage

TONE: Professional, efficient, actionable, practical`,

      ADVANCED: `You are an elite security researcher and exploit developer. Provide advanced technical analysis.

ANALYSIS APPROACH:
1. DEEP SCAN - Advanced vulnerability detection (race conditions, logic flaws, crypto issues)
2. CHAIN ATTACKS - Identify vulnerability combinations and attack chains
3. REVERSE ENGINEER - Analyze server-side code behavior and architecture
4. FUZZING STRATEGY - Intelligent input mutation and edge cases
5. BYPASS TECHNIQUES - WAF evasion, filter bypass, encoding tricks
6. NOVEL VECTORS - Zero-day potential and creative exploitation

OUTPUT REQUIREMENTS:
- Assume expert-level knowledge
- Focus on complex, non-obvious issues
- Provide advanced exploitation techniques
- Include architectural analysis
- Suggest fuzzing vectors and automation
- Identify business logic flaws
- Skip basic explanations

TONE: Technical, precise, expert-level, research-oriented`,
    };

    return prompts[mode];
  }

  /**
   * Build comprehensive analysis prompt
   */
  static buildAnalysisPrompt(
    request: RequestContext,
    relatedRequests: RelatedRequest[],
    userContext?: string,
    appContext?: ApplicationContext
  ): string {
    let prompt = `# SECURITY ANALYSIS REQUEST\n\n`;

    // Main Request Analysis
    prompt += `## TARGET REQUEST\n\n`;
    prompt += `**Endpoint:** ${request.method} ${request.url}\n\n`;

    // URL Analysis
    const urlObj = new URL(request.url);
    if (urlObj.search) {
      prompt += `**Query Parameters:**\n\`\`\`\n${this.formatQueryParams(urlObj.searchParams)}\`\`\`\n\n`;
    }

    // Headers
    prompt += `**Request Headers:**\n\`\`\`json\n${JSON.stringify(this.sanitizeHeaders(request.headers), null, 2)}\n\`\`\`\n\n`;

    // Body
    if (request.body) {
      prompt += `**Request Body:**\n\`\`\`\n${this.formatBody(request.body)}\n\`\`\`\n\n`;
    }

    // Response
    if (request.statusCode) {
      prompt += `## RESPONSE\n\n`;
      prompt += `**Status Code:** ${request.statusCode}\n`;

      if (request.duration) {
        prompt += `**Response Time:** ${request.duration}ms\n`;
      }

      if (request.responseHeaders) {
        prompt += `\n**Response Headers:**\n\`\`\`json\n${JSON.stringify(this.sanitizeHeaders(request.responseHeaders), null, 2)}\n\`\`\`\n\n`;
      }

      if (request.responseBody) {
        const truncatedBody = this.truncateResponseBody(request.responseBody);
        prompt += `**Response Body:**\n\`\`\`\n${truncatedBody}\n\`\`\`\n\n`;
      }
    }

    // Application Context
    if (appContext) {
      prompt += `## APPLICATION CONTEXT\n\n`;
      if (appContext.technology && appContext.technology.length > 0) {
        prompt += `**Technology Stack:** ${appContext.technology.join(', ')}\n`;
      }
      if (appContext.authentication) {
        prompt += `**Authentication:** ${appContext.authentication}\n`;
      }
      if (appContext.sessionType) {
        prompt += `**Session Management:** ${appContext.sessionType}\n`;
      }
      prompt += `\n`;
    }

    // Related Requests for Context
    if (relatedRequests.length > 0) {
      prompt += `## REQUEST FLOW CONTEXT\n\n`;
      prompt += `Recent requests to same domain (chronological):\n\n`;
      relatedRequests.slice(0, 5).forEach((req, idx) => {
        const time = new Date(req.timestamp).toISOString().split('T')[1].split('.')[0];
        prompt += `${idx + 1}. [${time}] ${req.method} ${this.shortenUrl(req.url)}`;
        if (req.statusCode) {
          prompt += ` → ${req.statusCode}`;
        }
        prompt += `\n`;
      });
      prompt += `\n`;
    }

    // User Context
    if (userContext) {
      prompt += `## ANALYST NOTES\n\n${userContext}\n\n`;
    }

    // Attack Surface Summary
    prompt += `## ATTACK SURFACE SUMMARY\n\n`;
    const attackSurface = this.identifyAttackSurface(request);
    prompt += attackSurface + `\n\n`;

    // Output Format
    prompt += this.getOutputFormatInstructions();

    return prompt;
  }

  /**
   * Identify attack surface from request
   */
  private static identifyAttackSurface(request: RequestContext): string {
    const urlObj = new URL(request.url);
    const params = Array.from(urlObj.searchParams.keys());

    let surface = `**Entry Points Detected:**\n`;

    if (params.length > 0) {
      surface += `- Query Parameters (${params.length}): ${params.join(', ')}\n`;
    }

    const cookies = request.headers['cookie'] || request.headers['Cookie'];
    if (cookies) {
      const cookieCount = cookies.toString().split(';').length;
      surface += `- Cookies (${cookieCount})\n`;
    }

    if (request.body) {
      try {
        const bodyObj = JSON.parse(request.body);
        const bodyParams = Object.keys(bodyObj);
        surface += `- Body Parameters (${bodyParams.length}): ${bodyParams.join(', ')}\n`;
      } catch {
        surface += `- Request Body (encoded/non-JSON)\n`;
      }
    }

    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (authHeader) {
      const authType = authHeader.toString().split(' ')[0];
      surface += `- Authentication: ${authType}\n`;
    }

    return surface;
  }

  /**
   * Get output format instructions
   */
  private static getOutputFormatInstructions(): string {
    return `## REQUIRED OUTPUT FORMAT

Respond with valid JSON in this exact structure:

\`\`\`json
{
  "summary": "Brief 1-2 sentence overview of findings",
  "vulnerabilities": [
    {
      "type": "SQLi|XSS_REFLECTED|XSS_STORED|XSS_DOM|IDOR|SSRF|XXE|RCE|LFI|RFI|SSTI|CSRF|CORS_MISCONFIGURATION|JWT_WEAK|AUTH_BYPASS|SESSION_FIXATION|PRIVILEGE_ESCALATION|INFO_DISCLOSURE|COMMAND_INJECTION|LDAP_INJECTION|XPATH_INJECTION|PATH_TRAVERSAL|DESERIALIZATION|RACE_CONDITION|BUSINESS_LOGIC|CUSTOM",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "title": "Concise vulnerability title",
      "description": "Detailed technical description of the vulnerability and how it works",
      "evidence": {
        "parameter": "vulnerable_param",
        "location": "query|body|header|cookie",
        "payload": "example_payload",
        "response": "relevant_response_snippet"
      },
      "remediation": "Specific steps to fix this vulnerability",
      "cwe": "CWE-XXX",
      "cvss": 7.5
    }
  ],
  "suggestions": {
    "nextSteps": [
      "Specific next action 1",
      "Specific next action 2"
    ],
    "payloads": [
      "Ready-to-use payload 1",
      "Ready-to-use payload 2"
    ],
    "references": [
      "https://relevant-resource-1.com",
      "https://relevant-resource-2.com"
    ],
    "toolsRecommended": [
      "sqlmap -u URL --risk=3",
      "ffuf -w wordlist.txt -u URL/FUZZ"
    ]
  },
  "attackSurface": {
    "parameters": ["param1", "param2"],
    "entryPoints": ["Entry point 1", "Entry point 2"],
    "interestingHeaders": ["Header1: value"],
    "technologies": ["Tech1", "Tech2"]
  },
  "confidence": 85
}
\`\`\`

**IMPORTANT RULES:**
1. Return ONLY valid JSON, no markdown, no explanations outside JSON
2. All vulnerabilities must have complete evidence
3. Payloads must be actionable and safe for testing
4. Confidence score (0-100) based on certainty
5. CWE and CVSS are optional but recommended
6. If no vulnerabilities found, return empty array but include suggestions for further testing`;
  }

  /**
   * Format query parameters
   */
  private static formatQueryParams(params: URLSearchParams): string {
    const formatted: string[] = [];
    params.forEach((value, key) => {
      formatted.push(`${key} = ${value}`);
    });
    return formatted.join('\n') || 'None';
  }

  /**
   * Sanitize headers (remove sensitive data from prompt)
   */
  private static sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };

    // Mask sensitive headers but keep structure
    if (sanitized['authorization'] || sanitized['Authorization']) {
      const authValue = sanitized['authorization'] || sanitized['Authorization'];
      const parts = authValue.toString().split(' ');
      if (parts.length === 2) {
        sanitized['authorization'] = `${parts[0]} [TOKEN_REDACTED_${parts[1].substring(0, 8)}...]`;
      }
    }

    if (sanitized['cookie'] || sanitized['Cookie']) {
      sanitized['cookie'] = '[COOKIES_PRESENT]';
    }

    return sanitized;
  }

  /**
   * Format request body
   */
  private static formatBody(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not JSON, return as-is but truncate if too long
      return body.length > 2000 ? body.substring(0, 2000) + '\n... [truncated]' : body;
    }
  }

  /**
   * Truncate response body to avoid token limits
   */
  private static truncateResponseBody(body: string, maxLength = 5000): string {
    if (body.length <= maxLength) {
      return body;
    }

    // Try to truncate at a reasonable boundary
    const truncated = body.substring(0, maxLength);
    const lastNewline = truncated.lastIndexOf('\n');

    if (lastNewline > maxLength * 0.8) {
      return truncated.substring(0, lastNewline) + '\n\n... [Response truncated for analysis]';
    }

    return truncated + '\n\n... [Response truncated for analysis]';
  }

  /**
   * Shorten URL for display
   */
  private static shortenUrl(url: string, maxLength = 80): string {
    if (url.length <= maxLength) {
      return url;
    }

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length > 3) {
        return `${urlObj.origin}/${pathParts[0]}/.../` + pathParts.slice(-2).join('/') + urlObj.search;
      }
    } catch {
      // Invalid URL, just truncate
    }

    return url.substring(0, maxLength) + '...';
  }
}
