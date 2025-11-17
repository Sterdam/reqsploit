import { Router, Request, Response } from 'express';
import { aiAnalyzer } from '../../core/ai/analyzer.js';
import { claudeClient } from '../../core/ai/claude-client.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';
import { prisma } from '../../server.js';
import { NotFoundError } from '../../utils/errors.js';
import { aiPricingService } from '../../services/ai-pricing.service.js';
import { proxySessionManager } from '../../core/proxy/session-manager.js';
import { RequestLogService } from '../../services/request-log.service.js';
import pLimit from 'p-limit';
import { falsePositiveService } from '../../services/false-positive.service.js';
import { requestGrouperService } from '../../services/request-grouper.service.js';

const router = Router();
const requestLogService = new RequestLogService(prisma);

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /ai/analyze/request/:requestId
 * Analyze a specific HTTP request
 */
router.post(
  '/analyze/request/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { model = 'auto' } = req.body; // Model selection

    // Get request from database
    const requestLog = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!requestLog) {
      throw new NotFoundError('Request not found');
    }

    // Analyze request with selected model
    const analysis = await aiAnalyzer.analyzeRequest(
      userId,
      requestId,
      {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      },
      model // Pass model to analyzer
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Request analysis completed',
    });
  })
);

/**
 * POST /ai/analyze/response/:requestId
 * Analyze a specific HTTP response
 */
router.post(
  '/analyze/response/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { model = 'auto' } = req.body; // Model selection

    // Get request from database
    const requestLog = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!requestLog || !requestLog.statusCode) {
      throw new NotFoundError('Request or response not found');
    }

    // Analyze response with selected model
    const analysis = await aiAnalyzer.analyzeResponse(
      userId,
      requestId,
      {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      },
      {
        statusCode: requestLog.statusCode,
        statusMessage: 'OK',
        headers: (requestLog.responseHeaders as Record<string, string>) || {},
        duration: requestLog.duration || 0,
      },
      model // Pass model to analyzer
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Response analysis completed',
    });
  })
);

/**
 * POST /ai/analyze/transaction/:requestId
 * Analyze complete HTTP transaction (request + response)
 */
router.post(
  '/analyze/transaction/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { model = 'auto' } = req.body; // Model selection

    // Get request from database
    const requestLog = await prisma.requestLog.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!requestLog || !requestLog.statusCode) {
      throw new NotFoundError('Complete transaction not found');
    }

    // Analyze transaction with selected model
    const analysis = await aiAnalyzer.analyzeTransaction(
      userId,
      requestId,
      {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      },
      {
        statusCode: requestLog.statusCode,
        statusMessage: 'OK',
        headers: (requestLog.responseHeaders as Record<string, string>) || {},
        duration: requestLog.duration || 0,
      },
      model // Pass model to analyzer
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Transaction analysis completed',
    });
  })
);

/**
 * POST /ai/analyze/intercepted/:requestId
 * Analyze an intercepted request with optional modifications
 */
router.post(
  '/analyze/intercepted/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { action, modifications, model = 'auto' } = req.body; // Model selection

    // Try to get request from intercept queue first
    const session = proxySessionManager.getSessionByUserId(userId);
    let httpRequest;

    if (session) {
      const queue = session.proxy.getRequestQueue();
      const queuedRequest = queue.get(requestId);

      if (queuedRequest) {
        // Request found in queue - use it
        httpRequest = {
          id: queuedRequest.id,
          method: modifications?.method || queuedRequest.method,
          url: modifications?.url || queuedRequest.url,
          headers: modifications?.headers || queuedRequest.headers,
          body: modifications?.body !== undefined ? modifications.body : queuedRequest.body || undefined,
          timestamp: queuedRequest.timestamp,
        };
      }
    }

    // Fallback to database if not in queue
    if (!httpRequest) {
      const requestLog = await prisma.requestLog.findFirst({
        where: {
          id: requestId,
          userId,
        },
      });

      if (!requestLog) {
        throw new NotFoundError('Intercepted request not found');
      }

      httpRequest = {
        id: requestLog.id,
        method: modifications?.method || requestLog.method,
        url: modifications?.url || requestLog.url,
        headers: modifications?.headers || (requestLog.headers as Record<string, string>),
        body: modifications?.body !== undefined ? modifications.body : requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      };
    }

    // Ensure RequestLog exists in database (required for AI analysis foreign key)
    // This is a production-ready, idempotent operation
    if (httpRequest) {
      await requestLogService.ensureRequestLog(requestId, userId, {
        method: httpRequest.method,
        url: httpRequest.url,
        headers: httpRequest.headers,
        body: httpRequest.body,
        timestamp: httpRequest.timestamp,
        isIntercepted: true,
      });
    }

    // Perform analysis based on action type with selected model
    let analysis;
    switch (action) {
      case 'analyzeRequest':
        analysis = await aiAnalyzer.analyzeRequest(userId, requestId, httpRequest, model);
        break;
      case 'explain':
        // Use analyzeRequest with EDUCATIONAL mode for explanations
        analysis = await aiAnalyzer.analyzeRequest(userId, requestId, httpRequest, model);
        break;
      case 'securityCheck':
        // Use analyzeRequest focused on security
        analysis = await aiAnalyzer.analyzeRequest(userId, requestId, httpRequest, model);
        break;
      default:
        analysis = await aiAnalyzer.analyzeRequest(userId, requestId, httpRequest, model);
    }

    res.json({
      success: true,
      data: analysis,
      message: `${action} analysis completed`,
    });
  })
);

/**
 * GET /ai/analysis/:analysisId
 * Get a specific AI analysis by ID
 */
router.get(
  '/analysis/:analysisId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { analysisId } = req.params;

    const analysis = await prisma.aIAnalysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      include: {
        vulnerabilities: true, // Fetch vulnerabilities relation
        requestLog: true, // Include request details for context
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    res.json({
      success: true,
      data: {
        analysisId: analysis.id,
        requestId: analysis.requestLogId,
        analysisType: analysis.mode,
        vulnerabilities: analysis.vulnerabilities, // Return actual vulnerabilities
        suggestions: analysis.suggestions,
        tokensUsed: analysis.tokensUsed,
        model: analysis.model || 'unknown', // Return stored model (added in schema)
        timestamp: analysis.createdAt,
        requestUrl: analysis.requestLog.url, // Include request URL for context
        requestMethod: analysis.requestLog.method, // Include method for context
      },
    });
  })
);

/**
 * GET /ai/history
 * Get AI analysis history for the user
 */
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const analyses = await aiAnalyzer.getAnalysisHistory(userId, limit);

    res.json({
      success: true,
      data: {
        analyses,
        count: analyses.length,
      },
    });
  })
);

/**
 * GET /ai/tokens
 * Get token usage for the user
 */
router.get(
  '/tokens',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const usage = await aiAnalyzer.getTokenUsage(userId);

    res.json({
      success: true,
      data: usage,
    });
  })
);

/**
 * POST /ai/exploits/generate
 * Generate exploit payloads for a vulnerability
 */
router.post(
  '/exploits/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { vulnerability, model = 'auto' } = req.body; // Model selection

    if (!vulnerability) {
      throw new NotFoundError('Vulnerability data required');
    }

    const exploits = await aiAnalyzer.generateExploits(userId, vulnerability, model); // Pass model to analyzer

    res.json({
      success: true,
      data: {
        exploits,
        count: exploits.length,
      },
      message: 'Exploit payloads generated',
    });
  })
);

/**
 * GET /ai/credits
 * Get user's AI token balance
 */
router.get(
  '/credits',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const balance = await aiPricingService.getTokenBalance(userId);

    res.json(balance);
  })
);

/**
 * GET /ai/pricing
 * Get pricing information (plans and action costs)
 */
router.get(
  '/pricing',
  asyncHandler(async (req: Request, res: Response) => {
    const pricingInfo = aiPricingService.getPricingInfo();

    res.json(pricingInfo);
  })
);

/**
 * POST /ai/quick-scan/:requestId
 * Quick security scan with Haiku (~3,600 tokens)
 */
router.post(
  '/quick-scan/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { model = 'haiku' } = req.body; // Model selection (default to Haiku for quick scan)

    // Try to get request from intercept queue first (like analyzeIntercepted)
    const session = proxySessionManager.getSessionByUserId(userId);
    let httpRequest;

    if (session) {
      const queue = session.proxy.getRequestQueue();
      const queuedRequest = queue.get(requestId);

      if (queuedRequest) {
        httpRequest = {
          id: queuedRequest.id,
          method: queuedRequest.method,
          url: queuedRequest.url,
          headers: queuedRequest.headers,
          body: queuedRequest.body || undefined,
          timestamp: queuedRequest.timestamp,
        };
      }
    }

    // Fallback to database if not in queue
    if (!httpRequest) {
      const requestLog = await prisma.requestLog.findFirst({
        where: {
          id: requestId,
          userId,
        },
      });

      if (!requestLog) {
        throw new NotFoundError('Request not found');
      }

      httpRequest = {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      };
    }

    // Ensure RequestLog exists in database (required for AI analysis foreign key)
    if (httpRequest) {
      await requestLogService.ensureRequestLog(requestId, userId, {
        method: httpRequest.method,
        url: httpRequest.url,
        headers: httpRequest.headers,
        body: httpRequest.body,
        timestamp: httpRequest.timestamp,
        isIntercepted: false,
      });
    }

    // Quick scan with selected model (defaults to Haiku)
    const analysis = await aiAnalyzer.analyzeRequest(userId, requestId, httpRequest, model);

    res.json({
      success: true,
      data: analysis,
      message: 'Quick scan completed',
    });
  })
);

/**
 * POST /ai/deep-scan/:requestId
 * Deep security scan with Sonnet (~14,000 tokens)
 */
router.post(
  '/deep-scan/:requestId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { model = 'sonnet' } = req.body; // Model selection (default to Sonnet for deep scan)

    // Try to get request from intercept queue first (like analyzeIntercepted)
    const session = proxySessionManager.getSessionByUserId(userId);
    let httpRequest;
    let httpResponse;

    if (session) {
      const queue = session.proxy.getRequestQueue();
      const queuedRequest = queue.get(requestId);

      if (queuedRequest) {
        httpRequest = {
          id: queuedRequest.id,
          method: queuedRequest.method,
          url: queuedRequest.url,
          headers: queuedRequest.headers,
          body: queuedRequest.body || undefined,
          timestamp: queuedRequest.timestamp,
        };
      }
    }

    // Fallback to database if not in queue
    if (!httpRequest) {
      const requestLog = await prisma.requestLog.findFirst({
        where: {
          id: requestId,
          userId,
        },
      });

      if (!requestLog) {
        throw new NotFoundError('Request not found');
      }

      httpRequest = {
        id: requestLog.id,
        method: requestLog.method,
        url: requestLog.url,
        headers: requestLog.headers as Record<string, string>,
        body: requestLog.body || undefined,
        timestamp: requestLog.timestamp,
      };

      // If we have response data, include it for deep scan
      if (requestLog.statusCode) {
        httpResponse = {
          statusCode: requestLog.statusCode,
          statusMessage: 'OK',
          headers: (requestLog.responseHeaders as Record<string, string>) || {},
          duration: requestLog.duration || 0,
        };
      }
    }

    // Ensure RequestLog exists in database (required for AI analysis foreign key)
    if (httpRequest) {
      await requestLogService.ensureRequestLog(requestId, userId, {
        method: httpRequest.method,
        url: httpRequest.url,
        headers: httpRequest.headers,
        body: httpRequest.body,
        timestamp: httpRequest.timestamp,
        isIntercepted: false,
      });
    }

    // Deep analysis with selected model (defaults to Sonnet)
    let analysis;
    if (httpResponse) {
      analysis = await aiAnalyzer.analyzeTransaction(userId, requestId, httpRequest, httpResponse, model);
    } else {
      // If no response yet, just analyze the request
      analysis = await aiAnalyzer.analyzeRequest(userId, requestId, httpRequest, model);
    }

    res.json({
      success: true,
      data: analysis,
      message: 'Deep scan completed',
    });
  })
);

/**
 * POST /ai/batch-analyze
 * Batch analyze multiple requests with parallel processing
 * Module 3.2: Enhanced with p-limit for 5 concurrent requests
 */
router.post(
  '/batch-analyze',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestIds, model = 'auto', concurrency = 5 } = req.body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new NotFoundError('Request IDs array required');
    }

    // Limit concurrent analyses to prevent overwhelming the AI API
    const limit = pLimit(Math.min(concurrency, 5));

    const results: Array<{ requestId: string; analysis: any }> = [];
    const errors: Array<{ requestId: string; error: string }> = [];

    // Track progress
    let completed = 0;
    const startTime = Date.now();

    // Process all requests in parallel with concurrency limit
    const promises = requestIds.map((requestId: string) =>
      limit(async () => {
        try {
          // Fetch request log
          const requestLog = await prisma.requestLog.findFirst({
            where: {
              id: requestId,
              userId,
            },
          });

          if (!requestLog) {
            errors.push({ requestId, error: 'Request not found' });
            completed++;
            return;
          }

          // Analyze request
          const analysis = await aiAnalyzer.analyzeRequest(
            userId,
            requestId,
            {
              id: requestLog.id,
              method: requestLog.method,
              url: requestLog.url,
              headers: requestLog.headers as Record<string, string>,
              body: requestLog.body || undefined,
              timestamp: requestLog.timestamp,
            },
            model
          );

          results.push({
            requestId,
            analysis,
          });

          completed++;
        } catch (error: any) {
          errors.push({
            requestId,
            error: error.message || 'Analysis failed',
          });
          completed++;
        }
      })
    );

    // Wait for all promises to complete
    await Promise.all(promises);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          total: requestIds.length,
          successful: results.length,
          failed: errors.length,
          duration, // in milliseconds
          averageTime: Math.round(duration / requestIds.length),
          concurrency,
        },
      },
      message: `Batch analysis completed: ${results.length}/${requestIds.length} successful in ${(duration / 1000).toFixed(1)}s`,
    });
  })
);

/**
 * POST /ai/suggest-tests/:tabId
 * Suggest security tests for a Repeater request
 */
router.post(
  '/suggest-tests/:tabId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { tabId } = req.params;
    const { method, url, headers, body, model = 'auto' } = req.body; // Model selection

    if (!method || !url) {
      throw new NotFoundError('Method and URL required');
    }

    // Build analysis context for test suggestions
    const analysisContext = `
Analyze this HTTP request and suggest security tests to perform:

Method: ${method}
URL: ${url}
Headers: ${JSON.stringify(headers, null, 2)}
Body: ${body || '(empty)'}

Provide specific test suggestions including:
1. Parameter manipulation tests (SQL injection, XSS, command injection, etc.)
2. Authentication bypass attempts
3. Authorization tests
4. Input validation tests
5. Rate limiting tests

For each test, provide:
- Test name and description
- Modified request variations (method, headers, body changes)
- Expected indicators of vulnerability
- Severity if vulnerability found
`;

    const prompt = `You are a penetration testing expert. Analyze the HTTP request and suggest practical security tests.

Return a JSON object with this structure:
{
  "tests": [
    {
      "id": "unique-test-id",
      "name": "Test name",
      "description": "What this test checks for",
      "category": "sqli|xss|auth|authz|injection|validation|ratelimit|other",
      "severity": "critical|high|medium|low",
      "variations": [
        {
          "description": "Variation description",
          "method": "GET|POST|PUT|DELETE|PATCH",
          "url": "modified URL if needed",
          "headers": { "modified": "headers" },
          "body": "modified body"
        }
      ],
      "indicators": ["What to look for in response to indicate vulnerability"]
    }
  ],
  "summary": "Brief summary of recommended tests"
}

Provide 5-10 most relevant tests based on the request type and parameters.`;

    const response = await claudeClient.analyze(analysisContext, prompt, { model }); // Pass model to Claude client

    // Parse response
    let suggestions;
    try {
      suggestions = JSON.parse(response.content);
    } catch {
      // Fallback if parsing fails
      suggestions = {
        tests: [],
        summary: response.content.substring(0, 500),
      };
    }

    res.json({
      success: true,
      data: {
        tabId,
        suggestions,
        tokensUsed: response.inputTokens + response.outputTokens,
        model: response.model,
      },
      message: 'Test suggestions generated',
    });
  })
);

/**
 * POST /ai/generate-payloads
 * Generate AI-powered context-aware payloads for fuzzing
 */
router.post(
  '/generate-payloads',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { category, context, count = 50, model = 'auto' } = req.body; // Model selection

    if (!category) {
      throw new NotFoundError('Payload category required');
    }

    // Build analysis context for payload generation
    const analysisContext = `
Generate context-aware fuzzing payloads for penetration testing.

Category: ${category}
Target Context: ${context || '(generic)'}
Count: ${count} payloads

Consider:
- Modern security controls and WAF bypass techniques
- Encoding variations (URL, HTML, Unicode, etc.)
- Case sensitivity and special characters
- Context-specific injection points
- Real-world exploitation scenarios
`;

    const prompt = `You are a penetration testing expert specializing in payload generation.

Generate ${count} effective fuzzing payloads for the "${category}" category.

Return a JSON object with this structure:
{
  "payloads": [
    {
      "value": "payload string",
      "description": "What this payload tests for",
      "encodingType": "none|url|html|unicode|base64",
      "severity": "critical|high|medium|low"
    }
  ],
  "category": "${category}",
  "totalCount": ${count},
  "summary": "Brief description of payload strategy"
}

Payload categories and their focus:
- sqli: SQL injection (UNION, boolean-based, time-based, error-based)
- xss: Cross-site scripting (reflected, stored, DOM-based, filter bypass)
- command_injection: OS command injection (bash, powershell, cmd)
- path_traversal: Directory traversal and file inclusion
- xxe: XML External Entity attacks
- ssti: Server-side template injection
- nosql: NoSQL injection (MongoDB, etc.)
- ldap: LDAP injection
- auth_bypass: Authentication bypass techniques
- idor: Insecure Direct Object Reference patterns

Provide diverse, effective payloads with modern bypass techniques.`;

    const response = await claudeClient.analyze(analysisContext, prompt, { model }); // Pass model to Claude client

    // Parse response
    let payloadData;
    try {
      payloadData = JSON.parse(response.content);
    } catch {
      // Fallback if parsing fails
      payloadData = {
        payloads: [],
        category,
        totalCount: 0,
        summary: response.content.substring(0, 500),
      };
    }

    res.json({
      success: true,
      data: {
        payloads: payloadData.payloads || [],
        category: payloadData.category || category,
        totalCount: payloadData.totalCount || payloadData.payloads?.length || 0,
        summary: payloadData.summary,
        tokensUsed: response.inputTokens + response.outputTokens,
        model: response.model,
      },
      message: 'Payloads generated successfully',
    });
  })
);

/**
 * POST /ai/generate-dorks
 * Generate search dorks (Google, Shodan, GitHub) for reconnaissance
 */
router.post(
  '/generate-dorks',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { target, objective, platforms = ['google', 'shodan', 'github'], model = 'auto' } = req.body; // Model selection

    if (!target || !objective) {
      throw new NotFoundError('Target and objective required');
    }

    // Build analysis context for dork generation
    const analysisContext = `
Generate reconnaissance search dorks for penetration testing and OSINT.

Target: ${target}
Objective: ${objective}
Platforms: ${platforms.join(', ')}

Consider:
- Information disclosure (credentials, API keys, configs)
- Exposed services and endpoints
- Vulnerable components and versions
- Development/staging environments
- Backup files and archives
- Source code leaks
- Employee information
- Subdomains and related infrastructure
`;

    const prompt = `You are an OSINT and reconnaissance expert specializing in search dork generation.

Generate effective search dorks for the target "${target}" with objective "${objective}".

Return a JSON object with this structure:
{
  "dorks": {
    "google": [
      {
        "query": "dork query string",
        "description": "What this dork searches for",
        "category": "credentials|configs|endpoints|files|subdomains|employees|other",
        "severity": "critical|high|medium|low"
      }
    ],
    "shodan": [
      {
        "query": "shodan query string",
        "description": "What this dork searches for",
        "category": "services|vulnerabilities|devices|certificates|other",
        "severity": "critical|high|medium|low"
      }
    ],
    "github": [
      {
        "query": "github query string",
        "description": "What this dork searches for",
        "category": "credentials|keys|configs|code|other",
        "severity": "critical|high|medium|low"
      }
    ]
  },
  "target": "${target}",
  "totalDorks": 0,
  "summary": "Brief overview of reconnaissance strategy"
}

Dork categories and focus:
- Google: site:, inurl:, intitle:, filetype:, intext:, cache:
- Shodan: hostname:, port:, product:, version:, vuln:, org:
- GitHub: org:, repo:, user:, filename:, extension:, path:

Generate 5-10 dorks per requested platform. Focus on high-impact reconnaissance.`;

    const response = await claudeClient.analyze(analysisContext, prompt, { model }); // Pass model to Claude client

    // Parse response
    let dorkData;
    try {
      dorkData = JSON.parse(response.content);
      // Calculate total dorks
      const totalDorks =
        (dorkData.dorks?.google?.length || 0) +
        (dorkData.dorks?.shodan?.length || 0) +
        (dorkData.dorks?.github?.length || 0);
      dorkData.totalDorks = totalDorks;
    } catch {
      // Fallback if parsing fails
      dorkData = {
        dorks: { google: [], shodan: [], github: [] },
        target,
        totalDorks: 0,
        summary: response.content.substring(0, 500),
      };
    }

    res.json({
      success: true,
      data: {
        dorks: dorkData.dorks || { google: [], shodan: [], github: [] },
        target: dorkData.target || target,
        totalDorks: dorkData.totalDorks || 0,
        summary: dorkData.summary,
        tokensUsed: response.inputTokens + response.outputTokens,
        model: response.model,
      },
      message: 'Dorks generated successfully',
    });
  })
);

/**
 * POST /ai/generate-attack-chain/:projectId
 * Generate multi-step attack chain based on project requests
 */
router.post(
  '/generate-attack-chain/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { objective, model = 'auto' } = req.body; // Model selection

    if (!objective) {
      throw new NotFoundError('Attack objective required');
    }

    // Fetch all requests from the project
    const requests = await prisma.requestLog.findMany({
      where: {
        projectId,
        userId,
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: 50, // Limit to prevent token overflow
    });

    if (requests.length === 0) {
      throw new NotFoundError('No requests found in project');
    }

    // Build summary of requests for analysis
    const requestsSummary = requests
      .map((req, index) => {
        return `
Request ${index + 1}:
- Method: ${req.method}
- URL: ${req.url}
- Status: ${req.statusCode || 'N/A'}
- Timestamp: ${req.timestamp}
${req.headers ? `- Headers: ${JSON.stringify(req.headers).substring(0, 200)}...` : ''}
${req.body ? `- Body: ${req.body.substring(0, 200)}...` : ''}
`;
      })
      .join('\n');

    // Build analysis context for attack chain generation
    const analysisContext = `
Analyze HTTP request logs to identify potential multi-step attack chain.

Objective: ${objective}
Total Requests: ${requests.length}

Request Logs:
${requestsSummary}

Consider:
- Authentication and authorization flows
- Session management and token handling
- API endpoint relationships and dependencies
- Data flow between requests
- Potential vulnerabilities that can be chained
- Privilege escalation opportunities
- Business logic flaws
`;

    const prompt = `You are a penetration testing expert specializing in attack chain analysis.

Analyze the HTTP request logs and generate a multi-step attack chain for objective: "${objective}".

Return a JSON object with this structure:
{
  "attackChain": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed description of this step",
      "requestReference": "Request 1, Request 3",
      "technique": "IDOR|SQLi|XSS|CSRF|Authentication Bypass|Privilege Escalation|Other",
      "payload": "Example payload or modification",
      "expectedResult": "What should happen",
      "dependencies": ["step 0"],
      "severity": "critical|high|medium|low"
    }
  ],
  "summary": "Executive summary of the attack chain",
  "totalSteps": 0,
  "estimatedImpact": "critical|high|medium|low",
  "prerequisites": ["What is needed before starting"],
  "detectionRisk": "high|medium|low",
  "recommendations": ["How to prevent this attack chain"]
}

Focus on:
1. Logical step progression
2. Realistic exploitation scenarios
3. Leveraging identified vulnerabilities
4. Achieving the stated objective

Provide a complete, executable attack chain with 3-8 steps.`;

    const response = await claudeClient.analyze(analysisContext, prompt, { model }); // Pass model to Claude client

    // Parse response
    let attackChainData;
    try {
      attackChainData = JSON.parse(response.content);
      attackChainData.totalSteps = attackChainData.attackChain?.length || 0;
    } catch {
      // Fallback if parsing fails
      attackChainData = {
        attackChain: [],
        summary: response.content.substring(0, 500),
        totalSteps: 0,
        estimatedImpact: 'medium',
        prerequisites: [],
        detectionRisk: 'medium',
        recommendations: [],
      };
    }

    res.json({
      success: true,
      data: {
        attackChain: attackChainData.attackChain || [],
        summary: attackChainData.summary,
        totalSteps: attackChainData.totalSteps || 0,
        estimatedImpact: attackChainData.estimatedImpact,
        prerequisites: attackChainData.prerequisites || [],
        detectionRisk: attackChainData.detectionRisk,
        recommendations: attackChainData.recommendations || [],
        tokensUsed: response.inputTokens + response.outputTokens,
        model: response.model,
      },
      message: 'Attack chain generated successfully',
    });
  })
);

/**
 * POST /ai/generate-report/:projectId
 * Generate comprehensive security report for a project
 */
router.post(
  '/generate-report/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { includeRemediation = true, format = 'json', model = 'auto' } = req.body; // Model selection

    // Fetch project info
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Fetch all requests from the project
    const requests = await prisma.requestLog.findMany({
      where: {
        projectId,
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Limit to prevent token overflow
    });

    // Fetch all AI analyses for this project
    const analyses = await prisma.aIAnalysis.findMany({
      where: {
        requestLog: {
          projectId,
          userId,
        },
      },
      include: {
        requestLog: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Build comprehensive context
    const analysisContext = `
Generate a comprehensive security assessment report for project: ${project.name}

Project Details:
- Name: ${project.name}
- Description: ${project.description || 'N/A'}
- Total Requests Captured: ${requests.length}
- AI Analyses Performed: ${analyses.length}
- Scope: ${project.scope ? JSON.stringify(project.scope) : 'Not defined'}

Request Summary:
${requests.slice(0, 50).map((req, i) => `${i + 1}. ${req.method} ${req.url} - Status: ${req.statusCode || 'N/A'}`).join('\n')}

AI Analysis Findings:
${analyses.slice(0, 20).map((analysis, i) => {
  const result = analysis.result as any;
  return `
Analysis ${i + 1}:
- Request: ${analysis.requestLog.method} ${analysis.requestLog.url}
- Mode: ${analysis.mode}
- Findings: ${result?.vulnerabilities?.length || 0} vulnerabilities
- Severity: ${result?.vulnerabilities?.[0]?.severity || 'N/A'}
`;
}).join('\n')}

Instructions:
${includeRemediation ? '- Include detailed remediation steps for each finding' : '- Focus on vulnerability descriptions only'}
- Provide actionable security recommendations
- Prioritize findings by risk/impact
- Include executive summary suitable for management
- Categorize findings by OWASP Top 10 or similar framework
`;

    const prompt = `You are a senior security consultant preparing a professional security assessment report.

Generate a comprehensive security report with the following structure:

{
  "executiveSummary": {
    "overview": "High-level summary of security posture",
    "criticalFindings": number,
    "highFindings": number,
    "mediumFindings": number,
    "lowFindings": number,
    "riskLevel": "critical|high|medium|low",
    "keyRecommendations": ["Top 3-5 recommendations"]
  },
  "projectOverview": {
    "name": "Project name",
    "scope": "Scope description",
    "testingPeriod": "Date range",
    "requestsAnalyzed": number,
    "aiAnalysesPerformed": number
  },
  "findings": [
    {
      "id": "finding-1",
      "title": "Vulnerability title",
      "severity": "critical|high|medium|low",
      "category": "OWASP category or type",
      "description": "Detailed description",
      "affectedEndpoints": ["List of URLs"],
      "evidence": "Technical evidence",
      "impact": "Business/technical impact",
      "likelihood": "Exploitation likelihood",
      "cvss": "CVSS score if applicable",
      ${includeRemediation ? '"remediation": "Step-by-step fix instructions",' : ''}
      "references": ["Links to documentation"]
    }
  ],
  "statistics": {
    "totalRequests": number,
    "uniqueEndpoints": number,
    "methodsDistribution": {"GET": x, "POST": y},
    "statusCodesDistribution": {"2xx": x, "4xx": y, "5xx": z},
    "vulnerabilityTypes": {"SQLi": x, "XSS": y}
  },
  "recommendations": {
    "immediate": ["Critical actions needed now"],
    "shortTerm": ["Actions for next 1-3 months"],
    "longTerm": ["Strategic security improvements"]
  },
  "conclusion": "Final assessment and overall recommendations"
}

Provide a professional, actionable security report.`;

    const response = await claudeClient.analyze(analysisContext, prompt, { model }); // Pass model to Claude client

    // Parse response
    let reportData;
    try {
      reportData = JSON.parse(response.content);
    } catch {
      // Fallback if parsing fails
      reportData = {
        executiveSummary: {
          overview: response.content.substring(0, 500),
          criticalFindings: 0,
          highFindings: 0,
          mediumFindings: 0,
          lowFindings: 0,
          riskLevel: 'medium',
          keyRecommendations: [],
        },
        projectOverview: {
          name: project.name,
          scope: project.scope || '',
          testingPeriod: 'N/A',
          requestsAnalyzed: requests.length,
          aiAnalysesPerformed: analyses.length,
        },
        findings: [],
        statistics: {},
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: [],
        },
        conclusion: '',
      };
    }

    res.json({
      success: true,
      data: {
        projectId,
        projectName: project.name,
        report: reportData,
        tokensUsed: response.inputTokens + response.outputTokens,
        model: response.model,
        generatedAt: new Date().toISOString(),
      },
      message: 'Security report generated successfully',
    });
  })
);

/**
 * POST /ai/suggest-tests
 * Generate AI-powered security test suggestions for Repeater
 */
router.post(
  '/suggest-tests',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { request, model = 'auto' } = req.body;

    if (!request || !request.method || !request.url) {
      throw new ValidationError('Request data is required (method, url)');
    }

    // Build context for test suggestion
    const requestContext = `HTTP Request to analyze for security testing:

Method: ${request.method}
URL: ${request.url}
Headers:
${JSON.stringify(request.headers || {}, null, 2)}
${request.body ? `\nBody:\n${request.body}` : ''}

Generate comprehensive security test suggestions for this request.`;

    try {
      // Import prompts
      const { TEST_SUGGESTION_PROMPT } = await import('../../core/ai/prompts.js');

      // Call Claude API with test suggestion prompt
      const selectedModel = model === 'auto' ? 'haiku-4.5' : model;
      const response = await anthropic.messages.create({
        model: selectedModel === 'sonnet-4.5' ? 'claude-sonnet-4-20250514' : 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        system: TEST_SUGGESTION_PROMPT,
        messages: [
          {
            role: 'user',
            content: requestContext,
          },
        ],
      });

      // Extract AI response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new AIServiceError('Unexpected AI response type');
      }

      let suggestions;
      try {
        // Try to parse JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          suggestions = JSON.parse(content.text);
        }
      } catch (parseError) {
        aiLogger.error('Failed to parse AI test suggestions', { error: parseError });
        throw new AIServiceError('AI returned invalid JSON response');
      }

      // Calculate and deduct tokens
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const tokenCost = aiPricingService.calculateTokenCost(
        selectedModel,
        response.usage.input_tokens,
        response.usage.output_tokens
      );
      await aiPricingService.deductTokens(userId, tokenCost);

      aiLogger.info('AI test suggestions generated', {
        userId,
        model: selectedModel,
        testsCount: suggestions.tests?.length || 0,
        tokensUsed,
        tokenCost,
      });

      res.json({
        success: true,
        data: {
          suggestions,
          tokensUsed: tokenCost,
          model: selectedModel,
        },
        message: 'Test suggestions generated successfully',
      });
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      aiLogger.error('Test suggestion generation failed', { error });
      throw new AIServiceError('Failed to generate test suggestions');
    }
  })
);

/**
 * GET /ai/history
 * Get analysis history for current user
 */
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { limit = '100', requestId } = req.query;

    const where: any = { userId };
    if (requestId) {
      where.requestLogId = requestId as string;
    }

    // Get analyses from database
    const analyses = await prisma.aIAnalysis.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      include: {
        requestLog: {
          select: {
            url: true,
            method: true,
          },
        },
        vulnerabilities: true, // Include vulnerabilities for frontend
      },
    });

    // Transform to frontend format
    const formattedAnalyses = analyses.map((analysis) => ({
      analysisId: analysis.id,
      requestId: analysis.requestLogId,
      requestUrl: analysis.requestLog?.url || 'Unknown',
      requestMethod: analysis.requestLog?.method || 'GET',
      analysisType: analysis.analysisType,
      vulnerabilities: analysis.vulnerabilities as any[],
      suggestions: analysis.suggestions as any[],
      timestamp: analysis.createdAt.toISOString(),
      confidence: analysis.confidence || 0,
      tokensUsed: analysis.tokensUsed || 0,
    }));

    res.json({
      success: true,
      data: formattedAnalyses,
      message: 'Analysis history retrieved successfully',
    });
  })
);

/**
 * GET /ai/usage-history
 * Get token usage history for analytics
 */
router.get(
  '/usage-history',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { days = '30' } = req.query;

    const daysCount = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    // Get analyses grouped by day
    const analyses = await prisma.aIAnalysis.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        tokensUsed: true,
        analysisType: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day
    const dailyUsage: Record<string, { date: string; tokensUsed: number; actions: number; byType: Record<string, number> }> = {};

    analyses.forEach((analysis) => {
      const dateKey = analysis.createdAt.toISOString().split('T')[0];

      if (!dailyUsage[dateKey]) {
        dailyUsage[dateKey] = {
          date: dateKey,
          tokensUsed: 0,
          actions: 0,
          byType: {},
        };
      }

      dailyUsage[dateKey].tokensUsed += analysis.tokensUsed || 0;
      dailyUsage[dateKey].actions += 1;

      const type = analysis.analysisType || 'unknown';
      dailyUsage[dateKey].byType[type] = (dailyUsage[dateKey].byType[type] || 0) + 1;
    });

    // Convert to array and sort by date
    const usageHistory = Object.values(dailyUsage).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json({
      success: true,
      data: {
        history: usageHistory,
        totalTokens: analyses.reduce((sum, a) => sum + (a.tokensUsed || 0), 0),
        totalActions: analyses.length,
        period: daysCount,
      },
      message: 'Usage history retrieved successfully',
    });
  })
);

/**
 * POST /ai/history/compare
 * Compare two analyses
 */
router.post(
  '/history/compare',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { baselineId, currentId } = req.body;

    if (!baselineId || !currentId) {
      return res.status(400).json({
        success: false,
        message: 'Both baselineId and currentId are required',
      });
    }

    // Get both analyses
    const [baseline, current] = await Promise.all([
      prisma.aIAnalysis.findFirst({
        where: { id: baselineId, userId },
        include: {
          requestLog: {
            select: {
              url: true,
              method: true,
            },
          },
        },
      }),
      prisma.aIAnalysis.findFirst({
        where: { id: currentId, userId },
        include: {
          requestLog: {
            select: {
              url: true,
              method: true,
            },
          },
        },
      }),
    ]);

    if (!baseline || !current) {
      throw new NotFoundError('One or both analyses not found');
    }

    // Format for frontend
    const formatAnalysis = (analysis: any) => ({
      analysisId: analysis.id,
      requestId: analysis.requestLogId,
      requestUrl: analysis.requestLog?.url || 'Unknown',
      requestMethod: analysis.requestLog?.method || 'GET',
      analysisType: analysis.analysisType,
      vulnerabilities: analysis.vulnerabilities as any[],
      suggestions: analysis.suggestions as any[],
      timestamp: analysis.createdAt.toISOString(),
      confidence: analysis.confidence || 0,
      tokensUsed: analysis.tokensUsed || 0,
    });

    res.json({
      success: true,
      data: {
        baseline: formatAnalysis(baseline),
        current: formatAnalysis(current),
      },
      message: 'Analyses retrieved for comparison',
    });
  })
);

// ============================================
// FALSE POSITIVE MANAGEMENT (Module 3.1)
// ============================================

/**
 * POST /ai/vulnerabilities/:vulnerabilityId/dismiss
 * Dismiss a vulnerability as false positive
 */
router.post(
  '/vulnerabilities/:vulnerabilityId/dismiss',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { vulnerabilityId } = req.params;
    const { reason, createPattern = false } = req.body;

    if (!reason || reason.trim().length === 0) {
      throw new NotFoundError('Dismiss reason is required');
    }

    await falsePositiveService.dismissVulnerability(userId, vulnerabilityId, reason, createPattern);

    res.json({
      success: true,
      message: 'Vulnerability dismissed as false positive',
    });
  })
);

/**
 * POST /ai/vulnerabilities/:vulnerabilityId/restore
 * Restore a dismissed vulnerability
 */
router.post(
  '/vulnerabilities/:vulnerabilityId/restore',
  asyncHandler(async (req: Request, res: Response) => {
    const { vulnerabilityId } = req.params;

    await falsePositiveService.restoreVulnerability(vulnerabilityId);

    res.json({
      success: true,
      message: 'Vulnerability restored',
    });
  })
);

/**
 * GET /ai/false-positives
 * Get all dismissed vulnerabilities for current user
 */
router.get(
  '/false-positives',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 100;

    const dismissed = await falsePositiveService.getDismissedVulnerabilities(userId, limit);

    res.json({
      success: true,
      data: dismissed,
      message: 'Dismissed vulnerabilities retrieved',
    });
  })
);

/**
 * GET /ai/false-positive-patterns
 * Get all false positive patterns for current user
 */
router.get(
  '/false-positive-patterns',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const activeOnly = req.query.activeOnly === 'true';

    const patterns = await falsePositiveService.getUserPatterns(userId, activeOnly);

    res.json({
      success: true,
      data: patterns,
      message: 'False positive patterns retrieved',
    });
  })
);

/**
 * DELETE /ai/false-positive-patterns/:patternId
 * Delete a false positive pattern
 */
router.delete(
  '/false-positive-patterns/:patternId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { patternId } = req.params;

    await falsePositiveService.deletePattern(userId, patternId);

    res.json({
      success: true,
      message: 'Pattern deleted',
    });
  })
);

/**
 * PATCH /ai/false-positive-patterns/:patternId/toggle
 * Toggle pattern active status
 */
router.patch(
  '/false-positive-patterns/:patternId/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { patternId } = req.params;

    await falsePositiveService.togglePatternStatus(userId, patternId);

    res.json({
      success: true,
      message: 'Pattern status toggled',
    });
  })
);

/**
 * GET /ai/false-positive-stats
 * Get false positive statistics for current user
 */
router.get(
  '/false-positive-stats',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const stats = await falsePositiveService.getFalsePositiveStats(userId);

    res.json({
      success: true,
      data: stats,
      message: 'False positive statistics retrieved',
    });
  })
);

// ============================================
// SMART BATCH SUGGESTIONS (Module 3.3)
// ============================================

/**
 * POST /ai/suggest-batches
 * Get smart batching suggestions for a list of requests
 */
router.post(
  '/suggest-batches',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestIds } = req.body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new NotFoundError('Request IDs array required');
    }

    const suggestions = await requestGrouperService.suggestBatches(userId, requestIds);

    res.json({
      success: true,
      data: suggestions,
      message: `Found ${suggestions.suggestedBatches} suggested batch groups`,
    });
  })
);

/**
 * POST /ai/group-details
 * Get detailed information about a specific group
 */
router.post(
  '/group-details',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { requestIds } = req.body;

    if (!Array.isArray(requestIds)) {
      throw new NotFoundError('Request IDs array required');
    }

    const details = await requestGrouperService.getGroupDetails(userId, requestIds);

    res.json({
      success: true,
      data: details,
      message: 'Group details retrieved',
    });
  })
);

export default router;
