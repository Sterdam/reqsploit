/**
 * Advanced Attack Surface Analyzer
 *
 * Intelligent analysis of HTTP requests to identify:
 * - All input parameters and entry points
 * - Potential vulnerability types per parameter
 * - Attack vectors and exploitation strategies
 * - Recommended testing payloads
 */

import { VulnerabilityType } from '@prisma/client';

export interface Parameter {
  name: string;
  value: string;
  location: 'query' | 'body' | 'header' | 'cookie' | 'path';
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unknown';
}

export interface VulnerabilityTarget {
  parameter: Parameter;
  vulnerabilityTypes: Array<{
    type: VulnerabilityType;
    confidence: number;
    reason: string;
    testPayloads: string[];
  }>;
}

export interface AttackSurfaceAnalysis {
  totalParameters: number;
  parameters: Parameter[];
  vulnerabilityTargets: VulnerabilityTarget[];
  recommendations: string[];
  riskScore: number; // 0-100
  complexity: 'low' | 'medium' | 'high';
}

export class AttackSurfaceAnalyzer {
  /**
   * Analyze complete attack surface of an HTTP request
   */
  static analyze(
    method: string,
    url: string,
    headers: Record<string, any>,
    body?: string
  ): AttackSurfaceAnalysis {
    const parameters: Parameter[] = [];

    // Extract query parameters
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, name) => {
        parameters.push({
          name,
          value,
          location: 'query',
          type: this.inferType(value),
        });
      });

      // Extract path parameters (numeric IDs, UUIDs, etc.)
      const pathParams = this.extractPathParameters(urlObj.pathname);
      parameters.push(...pathParams);
    } catch {
      // Invalid URL
    }

    // Extract header parameters
    Object.entries(headers).forEach(([name, value]) => {
      if (this.isInterestingHeader(name)) {
        parameters.push({
          name,
          value: String(value),
          location: 'header',
          type: this.inferType(String(value)),
        });
      }
    });

    // Extract cookie parameters
    const cookieParams = this.extractCookieParameters(headers);
    parameters.push(...cookieParams);

    // Extract body parameters
    if (body) {
      const bodyParams = this.extractBodyParameters(body);
      parameters.push(...bodyParams);
    }

    // Analyze each parameter for potential vulnerabilities
    const vulnerabilityTargets = parameters.map(param =>
      this.analyzeParameter(param, method, url, headers)
    );

    // Calculate risk score
    const riskScore = this.calculateRiskScore(vulnerabilityTargets);

    // Determine complexity
    const complexity = this.determineComplexity(parameters, vulnerabilityTargets);

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilityTargets, method, url);

    return {
      totalParameters: parameters.length,
      parameters,
      vulnerabilityTargets,
      recommendations,
      riskScore,
      complexity,
    };
  }

  /**
   * Extract path parameters (IDs, UUIDs, etc.)
   */
  private static extractPathParameters(pathname: string): Parameter[] {
    const params: Parameter[] = [];
    const segments = pathname.split('/').filter(Boolean);

    segments.forEach((segment, index) => {
      // Numeric ID
      if (/^\d+$/.test(segment)) {
        params.push({
          name: `path_id_${index}`,
          value: segment,
          location: 'path',
          type: 'number',
        });
      }
      // UUID
      else if (/^[a-f0-9-]{36}$/i.test(segment)) {
        params.push({
          name: `path_uuid_${index}`,
          value: segment,
          location: 'path',
          type: 'string',
        });
      }
      // MongoDB ObjectId
      else if (/^[a-f0-9]{24}$/i.test(segment)) {
        params.push({
          name: `path_objectid_${index}`,
          value: segment,
          location: 'path',
          type: 'string',
        });
      }
    });

    return params;
  }

  /**
   * Extract cookie parameters
   */
  private static extractCookieParameters(headers: Record<string, any>): Parameter[] {
    const params: Parameter[] = [];
    const cookie = headers['cookie'] || headers['Cookie'];

    if (cookie) {
      const cookieString = String(cookie);
      const pairs = cookieString.split(';').map(c => c.trim());

      pairs.forEach(pair => {
        const [name, ...valueParts] = pair.split('=');
        const value = valueParts.join('=');
        if (name && value) {
          params.push({
            name: name.trim(),
            value: value.trim(),
            location: 'cookie',
            type: this.inferType(value),
          });
        }
      });
    }

    return params;
  }

  /**
   * Extract body parameters
   */
  private static extractBodyParameters(body: string): Parameter[] {
    const params: Parameter[] = [];

    try {
      // Try JSON
      const jsonObj = JSON.parse(body);
      this.flattenObject(jsonObj, '').forEach(({ key, value }) => {
        params.push({
          name: key,
          value: String(value),
          location: 'body',
          type: this.inferType(value),
        });
      });
    } catch {
      // Try URL-encoded
      try {
        const urlencoded = new URLSearchParams(body);
        urlencoded.forEach((value, name) => {
          params.push({
            name,
            value,
            location: 'body',
            type: this.inferType(value),
          });
        });
      } catch {
        // Unsupported body format
      }
    }

    return params;
  }

  /**
   * Flatten nested object
   */
  private static flattenObject(
    obj: any,
    prefix = ''
  ): Array<{ key: string; value: any }> {
    const result: Array<{ key: string; value: any }> = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result.push(...this.flattenObject(value, fullKey));
      } else {
        result.push({ key: fullKey, value });
      }
    }

    return result;
  }

  /**
   * Check if header is interesting for security analysis
   */
  private static isInterestingHeader(name: string): boolean {
    const interesting = [
      'authorization',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token',
      'x-requested-with',
      'referer',
      'origin',
      'host',
      'user-agent',
    ];

    return interesting.some(h => name.toLowerCase().includes(h));
  }

  /**
   * Infer parameter type from value
   */
  private static inferType(value: any): Parameter['type'] {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'string') {
      if (/^\d+$/.test(value)) return 'number';
      if (value === 'true' || value === 'false') return 'boolean';
      return 'string';
    }
    return 'unknown';
  }

  /**
   * Analyze parameter for potential vulnerabilities
   */
  private static analyzeParameter(
    param: Parameter,
    method: string,
    url: string,
    headers: Record<string, any>
  ): VulnerabilityTarget {
    const vulnerabilityTypes: VulnerabilityTarget['vulnerabilityTypes'] = [];

    // SQL Injection indicators
    const sqlIndicators = ['id', 'user', 'userid', 'username', 'search', 'query', 'filter', 'sort', 'order'];
    if (sqlIndicators.some(ind => param.name.toLowerCase().includes(ind))) {
      vulnerabilityTypes.push({
        type: 'SQLi',
        confidence: 75,
        reason: `Parameter '${param.name}' commonly used in database queries`,
        testPayloads: [
          "' OR '1'='1",
          "1' OR '1'='1'--",
          "' UNION SELECT NULL--",
          "1' AND 1=1--",
          "' AND SLEEP(5)--",
        ],
      });
    }

    // XSS indicators
    const xssIndicators = ['name', 'comment', 'message', 'text', 'content', 'description', 'title', 'body'];
    if (xssIndicators.some(ind => param.name.toLowerCase().includes(ind)) && param.type === 'string') {
      vulnerabilityTypes.push({
        type: 'XSS_REFLECTED',
        confidence: 70,
        reason: `Parameter '${param.name}' likely reflected in response`,
        testPayloads: [
          '<script>alert(1)</script>',
          '<img src=x onerror=alert(1)>',
          '<svg onload=alert(1)>',
          'javascript:alert(1)',
          '"><script>alert(1)</script>',
        ],
      });
    }

    // IDOR indicators
    if (param.location === 'path' && param.type === 'number') {
      vulnerabilityTypes.push({
        type: 'IDOR',
        confidence: 65,
        reason: `Numeric ID in URL path may be vulnerable to IDOR`,
        testPayloads: [
          `${parseInt(param.value) + 1}`,
          `${parseInt(param.value) - 1}`,
          '0',
          '1',
          '999999',
        ],
      });
    }

    // Path Traversal indicators
    const pathIndicators = ['file', 'path', 'dir', 'folder', 'page', 'template', 'include'];
    if (pathIndicators.some(ind => param.name.toLowerCase().includes(ind))) {
      vulnerabilityTypes.push({
        type: 'PATH_TRAVERSAL',
        confidence: 60,
        reason: `Parameter '${param.name}' may be used for file operations`,
        testPayloads: [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
          '....//....//....//etc/passwd',
          '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        ],
      });
    }

    // SSRF indicators
    const ssrfIndicators = ['url', 'uri', 'link', 'redirect', 'callback', 'webhook'];
    if (ssrfIndicators.some(ind => param.name.toLowerCase().includes(ind))) {
      vulnerabilityTypes.push({
        type: 'SSRF',
        confidence: 55,
        reason: `Parameter '${param.name}' may be used for external requests`,
        testPayloads: [
          'http://localhost/',
          'http://127.0.0.1/',
          'http://169.254.169.254/latest/meta-data/',
          'file:///etc/passwd',
        ],
      });
    }

    // Command Injection indicators
    const cmdIndicators = ['cmd', 'command', 'exec', 'run', 'ping', 'host'];
    if (cmdIndicators.some(ind => param.name.toLowerCase().includes(ind))) {
      vulnerabilityTypes.push({
        type: 'COMMAND_INJECTION',
        confidence: 70,
        reason: `Parameter '${param.name}' may be passed to system commands`,
        testPayloads: [
          '; ls -la',
          '| whoami',
          '`whoami`',
          '$(whoami)',
          '& ping -c 4 127.0.0.1',
        ],
      });
    }

    // JWT Token vulnerabilities
    if (param.name.toLowerCase().includes('token') || param.name.toLowerCase().includes('jwt')) {
      const tokenValue = param.value;
      if (tokenValue.split('.').length === 3) {
        vulnerabilityTypes.push({
          type: 'JWT_WEAK',
          confidence: 50,
          reason: `JWT token detected, check for weak signing algorithms`,
          testPayloads: [
            'none algorithm test',
            'weak secret brute-force',
            'algorithm confusion',
          ],
        });
      }
    }

    return {
      parameter: param,
      vulnerabilityTypes,
    };
  }

  /**
   * Calculate overall risk score
   */
  private static calculateRiskScore(targets: VulnerabilityTarget[]): number {
    let totalScore = 0;
    let count = 0;

    targets.forEach(target => {
      target.vulnerabilityTypes.forEach(vuln => {
        const severityMultiplier = {
          SQLi: 1.5,
          RCE: 1.5,
          COMMAND_INJECTION: 1.5,
          SSRF: 1.3,
          XSS_REFLECTED: 1.2,
          IDOR: 1.1,
          PATH_TRAVERSAL: 1.2,
          JWT_WEAK: 1.1,
        };

        const multiplier = (severityMultiplier as any)[vuln.type] || 1.0;
        totalScore += vuln.confidence * multiplier;
        count++;
      });
    });

    return count > 0 ? Math.min(100, Math.round(totalScore / count)) : 0;
  }

  /**
   * Determine complexity level
   */
  private static determineComplexity(
    parameters: Parameter[],
    targets: VulnerabilityTarget[]
  ): 'low' | 'medium' | 'high' {
    const paramCount = parameters.length;
    const vulnCount = targets.reduce((sum, t) => sum + t.vulnerabilityTypes.length, 0);

    if (paramCount <= 3 && vulnCount <= 2) return 'low';
    if (paramCount <= 8 && vulnCount <= 5) return 'medium';
    return 'high';
  }

  /**
   * Generate testing recommendations
   */
  private static generateRecommendations(
    targets: VulnerabilityTarget[],
    method: string,
    url: string
  ): string[] {
    const recommendations: string[] = [];
    const vulnTypes = new Set<VulnerabilityType>();

    // Collect unique vulnerability types
    targets.forEach(target => {
      target.vulnerabilityTypes.forEach(v => vulnTypes.add(v.type));
    });

    // Generate specific recommendations
    if (vulnTypes.has('SQLi')) {
      recommendations.push('Run sqlmap for automated SQL injection testing: sqlmap -u "' + url + '" --risk=3 --level=5');
    }

    if (vulnTypes.has('XSS_REFLECTED')) {
      recommendations.push('Test XSS with various encoding and contexts: HTML, JavaScript, attribute injection');
    }

    if (vulnTypes.has('IDOR')) {
      recommendations.push('Test IDOR by incrementing/decrementing IDs and testing access to other users\' resources');
    }

    if (vulnTypes.has('SSRF')) {
      recommendations.push('Test SSRF with internal IPs (127.0.0.1, 169.254.169.254) and localhost variations');
    }

    if (vulnTypes.has('PATH_TRAVERSAL')) {
      recommendations.push('Test path traversal with various encoding techniques and OS-specific paths');
    }

    if (vulnTypes.has('COMMAND_INJECTION')) {
      recommendations.push('Test command injection with time-based detection (sleep, ping) and output redirection');
    }

    // General recommendations
    if (method === 'POST' || method === 'PUT') {
      recommendations.push('Test Content-Type manipulation and parameter pollution');
    }

    if (targets.length > 5) {
      recommendations.push('Consider fuzzing all parameters with ffuf or similar tools');
    }

    return recommendations;
  }
}
