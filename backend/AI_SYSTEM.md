# ReqSploit AI System Documentation

## Overview

The ReqSploit AI System is an intelligent security analysis engine with three specialized modes designed to meet different user expertise levels and analysis requirements.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Analysis Request                        │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │   AnalysisService           │
              │  - Mode Selection           │
              │  - Token Management         │
              └──────────────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌──────▼──────┐     ┌──────▼──────┐
   │ Prompt  │        │  Context    │     │   Attack    │
   │ Builder │        │  Builder    │     │   Surface   │
   │         │        │             │     │  Analyzer   │
   └────┬────┘        └──────┬──────┘     └──────┬──────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Claude API     │
                    │  (Anthropic)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Vulnerability  │
                    │   Detection     │
                    └─────────────────┘
```

## Three AI Modes

### 1. EDUCATIONAL Mode 🎓

**Target Audience**: Beginners and learning-focused users

**Characteristics**:
- **Verbosity**: High (detailed explanations)
- **Max Tokens**: 4096
- **Focus**: Teaching and understanding

**Output Includes**:
- WHY vulnerabilities exist (root cause analysis)
- HOW they work technically (detailed mechanisms)
- WHAT the risks are (business and technical impact)
- HOW to exploit (ethical, educational purpose)
- HOW to fix (secure coding practices)
- Learning resources (links, documentation, CVEs)

**Use Cases**:
- Security training and education
- Understanding vulnerability principles
- Learning penetration testing
- Junior security researchers

**Example System Prompt**:
```
You are an expert web security mentor and educator. Your mission is to teach and empower security researchers.

ANALYSIS APPROACH:
1. EXPLAIN THE WHY - Root cause and security principles violated
2. SHOW THE HOW - Technical mechanism and attack flow
3. ASSESS THE IMPACT - Business and technical risks (CVSS scoring)
4. DEMONSTRATE EXPLOITATION - Step-by-step with ethical context
5. TEACH REMEDIATION - Secure coding practices and fixes
6. PROVIDE RESOURCES - Documentation, CVEs, learning materials
```

### 2. DEFAULT Mode ⚡

**Target Audience**: Professional pentesters and security practitioners

**Characteristics**:
- **Verbosity**: Balanced (actionable insights)
- **Max Tokens**: 2048
- **Focus**: Fast, practical results

**Output Includes**:
- Vulnerability detection with severity levels
- Ready-to-use exploitation payloads
- Prioritized findings by risk
- Actionable remediation steps
- Next testing steps

**Use Cases**:
- Professional penetration testing
- Security assessments
- Quick vulnerability scans
- Production security testing

**Example System Prompt**:
```
You are a professional pentesting AI assistant. Provide fast, actionable security analysis.

ANALYSIS APPROACH:
1. DETECT - Identify vulnerabilities with severity levels
2. EXPLOIT - Provide ready-to-use payloads and PoC
3. PRIORITIZE - Rank findings by risk and exploitability
4. RECOMMEND - Give actionable remediation steps
```

### 3. ADVANCED Mode 🔬

**Target Audience**: Expert security researchers and bug bounty hunters

**Characteristics**:
- **Verbosity**: Minimal (technical precision)
- **Max Tokens**: 8192
- **Focus**: Deep technical analysis

**Output Includes**:
- Advanced vulnerability detection (race conditions, logic flaws)
- Vulnerability chaining opportunities
- Server-side code analysis
- Intelligent fuzzing strategies
- Complex exploitation techniques
- Novel attack vectors

**Use Cases**:
- Advanced security research
- Bug bounty hunting
- Zero-day discovery
- Complex security audits
- Architectural security review

**Example System Prompt**:
```
You are an elite security researcher and exploit developer. Provide advanced technical analysis.

ANALYSIS APPROACH:
1. DEEP SCAN - Advanced vulnerability detection
2. CHAIN ATTACKS - Identify vulnerability combinations
3. REVERSE ENGINEER - Analyze server-side behavior
4. FUZZING STRATEGY - Intelligent input mutation
5. BYPASS TECHNIQUES - WAF evasion, filter bypass
6. NOVEL VECTORS - Zero-day potential
```

## Core Components

### 1. PromptBuilder (`/backend/src/core/ai/prompt-builder.ts`)

**Purpose**: Builds intelligent, context-aware prompts for Claude API

**Features**:
- Mode-specific system prompts
- Comprehensive request analysis formatting
- Attack surface summary generation
- Structured JSON output format requirements
- Intelligent header sanitization (removes sensitive tokens)
- Response body truncation for token optimization

**Key Methods**:
- `getSystemPrompt(mode)` - Returns optimized prompt for each mode
- `buildAnalysisPrompt()` - Constructs full analysis request
- `identifyAttackSurface()` - Summarizes entry points

### 2. ContextBuilder (`/backend/src/core/ai/context-builder.ts`)

**Purpose**: Builds comprehensive application context from request history

**Features**:
- **Technology Detection**: Server, framework, libraries
- **Authentication Analysis**: JWT, session cookies, OAuth
- **Session Management**: Stateful vs stateless detection
- **API Endpoint Mapping**: Automatic API discovery
- **Security Headers Detection**: CSP, HSTS, X-Frame-Options, etc.
- **Vulnerability Indicators**: Pattern-based pre-analysis
- **Request Flow Analysis**: User journey identification

**Key Methods**:
- `buildApplicationContext()` - Complete app context
- `detectTechnology()` - Tech stack identification
- `detectAuthentication()` - Auth mechanism detection
- `identifyVulnerabilityIndicators()` - Pattern-based detection
- `buildRequestFlow()` - User journey analysis

**Technology Detection Examples**:
```typescript
// Detects from headers
'x-powered-by: PHP' → PHP
'server: nginx' → Nginx
'set-cookie: laravel_session' → Laravel

// Detects from response body
'_next' in HTML → Next.js
'wp-content' in HTML → WordPress
'__reactContainer' → React
```

### 3. AttackSurfaceAnalyzer (`/backend/src/core/ai/attack-surface-analyzer.ts`)

**Purpose**: Intelligent parameter analysis and vulnerability mapping

**Features**:
- **Parameter Extraction**: Query, body, headers, cookies, path
- **Type Inference**: String, number, boolean, object, array
- **Vulnerability Mapping**: Each parameter → potential vuln types
- **Confidence Scoring**: 0-100% confidence per vulnerability
- **Payload Generation**: Ready-to-use test payloads
- **Risk Scoring**: Overall request risk (0-100)
- **Complexity Assessment**: Low, medium, high

**Vulnerability Detection Logic**:

| Parameter Pattern | Detected Vulnerability | Confidence | Test Payloads |
|------------------|------------------------|------------|---------------|
| `id`, `user`, `search` | SQL Injection | 75% | `' OR '1'='1`, `' UNION SELECT NULL--` |
| `name`, `comment`, `message` | XSS Reflected | 70% | `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>` |
| Numeric path ID | IDOR | 65% | `id+1`, `id-1`, `999999` |
| `file`, `path`, `dir` | Path Traversal | 60% | `../../../etc/passwd` |
| `url`, `callback`, `webhook` | SSRF | 55% | `http://localhost/`, `http://169.254.169.254/` |
| `cmd`, `exec`, `ping` | Command Injection | 70% | `; ls -la`, `\| whoami` |
| JWT token detected | JWT Weak | 50% | Algorithm confusion, weak secret |

**Risk Score Calculation**:
```typescript
Risk Score = Σ(confidence × severityMultiplier) / vulnerabilityCount

Severity Multipliers:
- SQLi, RCE, Command Injection: 1.5x
- SSRF: 1.3x
- XSS, Path Traversal: 1.2x
- IDOR, JWT: 1.1x
```

## Analysis Workflow

### Step 1: Request Ingestion
```typescript
POST /api/analysis
{
  "requestLogId": "uuid",
  "mode": "DEFAULT|EDUCATIONAL|ADVANCED",
  "userContext": "Optional analyst notes"
}
```

### Step 2: Context Building
1. Extract domain from request URL
2. Query last 1 hour of requests to same domain
3. Detect technology stack, framework, auth mechanism
4. Map API endpoints and security headers
5. Identify pre-existing vulnerability indicators

### Step 3: Attack Surface Analysis
1. Extract all parameters (query, body, headers, cookies, path)
2. Infer parameter types
3. Map parameters to potential vulnerabilities
4. Generate confidence scores
5. Create test payloads
6. Calculate risk score

### Step 4: Prompt Construction
1. Select mode-specific system prompt
2. Format request data (method, URL, headers, body, response)
3. Add application context (tech, auth, APIs)
4. Include related requests for flow understanding
5. Add user context notes
6. Specify JSON output format

### Step 5: Claude API Call
```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: mode === 'EDUCATIONAL' ? 4096 : mode === 'ADVANCED' ? 8192 : 2048,
  temperature: 0.7,
  system: systemPrompt,
  messages: [{ role: 'user', content: analysisPrompt }]
});
```

### Step 6: Response Parsing
1. Extract JSON from response
2. Parse vulnerabilities array
3. Extract suggestions and recommendations
4. Calculate confidence score
5. Store in database with relationships

### Step 7: Token Management
1. Calculate tokens used (input + output)
2. Get user's plan limits (FREE: 10K, PRO: 100K, ENTERPRISE: 500K)
3. Update monthly token usage
4. Check remaining tokens
5. Return usage info to user

## API Endpoints

### Create Analysis
```http
POST /api/analysis
Authorization: Bearer {token}
Content-Type: application/json

{
  "requestLogId": "uuid",
  "mode": "DEFAULT",
  "userContext": "Testing login endpoint for SQLi"
}

Response:
{
  "success": true,
  "data": {
    "analysis": {
      "id": "uuid",
      "mode": "DEFAULT",
      "aiResponse": "...",
      "suggestions": {},
      "tokensUsed": 1234,
      "confidence": 85,
      "createdAt": "2025-11-15T10:00:00Z"
    },
    "vulnerabilities": [
      {
        "type": "SQLi",
        "severity": "CRITICAL",
        "title": "SQL Injection in search parameter",
        "description": "...",
        "evidence": { "parameter": "search", "payload": "'" },
        "remediation": "Use parameterized queries",
        "cwe": "CWE-89",
        "cvss": 9.8
      }
    ],
    "tokensRemaining": 8766
  }
}
```

### Get Attack Surface
```http
GET /api/analysis/attack-surface/{requestLogId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "totalParameters": 5,
    "riskScore": 75,
    "complexity": "medium",
    "parameters": [
      { "name": "search", "location": "query", "type": "string" },
      { "name": "id", "location": "path", "type": "number" }
    ],
    "vulnerabilities": [
      {
        "parameter": "search",
        "location": "query",
        "detectedVulnerabilities": [
          {
            "type": "SQLi",
            "confidence": 75,
            "reason": "Parameter commonly used in database queries",
            "testPayloads": ["' OR '1'='1", "1' OR '1'='1'--", "' UNION SELECT NULL--"]
          }
        ]
      }
    ],
    "recommendations": [
      "Run sqlmap for automated SQL injection testing",
      "Test XSS with various encoding and contexts"
    ]
  }
}
```

### Check Token Status
```http
GET /api/analysis/tokens/status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "available": true,
    "used": 1234,
    "limit": 10000,
    "remaining": 8766
  }
}
```

## Token Usage Limits

| Plan | Monthly Tokens | Est. Analyses |
|------|----------------|---------------|
| **FREE** | 10,000 | ~30-50 |
| **PRO** | 100,000 | ~300-500 |
| **ENTERPRISE** | 500,000 | ~1,500-2,500 |

**Token Estimation**:
- EDUCATIONAL mode: ~300-400 tokens per analysis
- DEFAULT mode: ~150-250 tokens per analysis
- ADVANCED mode: ~500-800 tokens per analysis

## Best Practices

### For Users

1. **Choose the Right Mode**:
   - Learning? → EDUCATIONAL
   - Professional testing? → DEFAULT
   - Advanced research? → ADVANCED

2. **Provide Context**:
   - Add analyst notes in `userContext`
   - Helps AI understand testing goals
   - Improves relevance of findings

3. **Review Attack Surface First**:
   - Use `/attack-surface` endpoint
   - Understand entry points
   - Plan testing strategy

4. **Monitor Token Usage**:
   - Check `/tokens/status` regularly
   - Optimize analysis frequency
   - Upgrade plan if needed

### For Developers

1. **Error Handling**:
   - Always check token availability before analysis
   - Handle 403 errors (token limit exceeded)
   - Implement retry logic with exponential backoff

2. **Context Building**:
   - Batch requests to same domain
   - Build comprehensive context over time
   - Store application context for reuse

3. **Performance**:
   - Cache analysis results
   - Implement request deduplication
   - Use attack surface analysis for quick pre-screening

## Future Enhancements

- [ ] Custom mode configuration (user-defined prompts)
- [ ] Analysis templates for common scenarios
- [ ] Automated vulnerability chaining
- [ ] Integration with fuzzing tools
- [ ] Real-time streaming analysis
- [ ] Multi-request correlation analysis
- [ ] Machine learning confidence tuning
- [ ] Custom payload generation
