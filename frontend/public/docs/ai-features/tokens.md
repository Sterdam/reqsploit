# 💰 Token System & Pricing

**Understand ReqSploit's token-based AI pricing and optimize your usage**

ReqSploit uses a token-based system for AI features powered by Claude by Anthropic. This guide explains how tokens work, pricing plans, and optimization strategies.

---

## 📋 Table of Contents

1. [What are Tokens?](#what-are-tokens)
2. [Token Usage by Feature](#token-usage-by-feature)
3. [Pricing Plans](#pricing-plans)
4. [Token Tracking](#token-tracking)
5. [Optimization Strategies](#optimization-strategies)
6. [Token Renewal](#token-renewal)
7. [Frequently Asked Questions](#frequently-asked-questions)

---

## What are Tokens?

**Tokens** are the currency used to measure AI feature usage in ReqSploit. Each AI operation (scan, payload generation, test suggestion) consumes tokens based on complexity.

### How Tokens Work

**Claude AI Token System:**
- Tokens measure both **input** (your request) and **output** (AI response)
- 1 token ≈ 4 characters or ≈ 0.75 words
- Example: "Hello World" = ~3 tokens

**ReqSploit Token Calculation:**
```
Total Tokens = Input Tokens + Output Tokens

Example: Quick Scan
- Input: Request + headers + body (~2K tokens)
- Output: Vulnerability report (~6K tokens)
- Total: ~8K tokens
```

### Why Token-Based Pricing?

**✅ Fair Usage:**
- Pay only for what you use
- No artificial limits on features
- Scales with your needs

**✅ Transparency:**
- Real-time token tracking
- Detailed usage breakdowns
- Predict costs before use

**✅ Flexibility:**
- Choose between speed (Quick) or depth (Deep)
- Optimize based on target importance
- Control your spending

---

## Token Usage by Feature

### AI Scans

| Feature | Model | Tokens | Speed | Best For |
|---------|-------|--------|-------|----------|
| **Quick Scan** ⚡ | Haiku 4.5 | ~8,000 | 20-30s | Rapid testing, initial triage |
| **Deep Scan** 🔬 | Sonnet 4.5 | ~16,000 | 60-90s | Critical endpoints, thorough analysis |

**Example Calculation:**
```
Scenario: Testing e-commerce checkout flow (5 endpoints)

Option 1: Deep Scan All
5 endpoints × 16K tokens = 80,000 tokens

Option 2: Hybrid Approach (Recommended)
- Quick Scan all 5 endpoints: 5 × 8K = 40,000 tokens
- Deep Scan 2 critical (payment, auth): 2 × 16K = 32,000 tokens
- Total: 72,000 tokens (10% savings + better strategy)
```

### AI Test Suggestions

**Generate security test cases from requests:**

| Complexity | Tokens | Tests Generated | Use Case |
|------------|--------|-----------------|----------|
| **Basic** | ~3,000 | 5-8 tests | Simple endpoints |
| **Standard** | ~5,000 | 8-12 tests | Typical APIs |
| **Advanced** | ~8,000 | 12-20 tests | Complex logic |

**Example:**
```
Request: POST /api/users/update

AI Test Suggestions (~5K tokens):
✅ IDOR test - Change user ID
✅ Privilege escalation - Add admin role
✅ SQL injection in email field
✅ XSS in username parameter
✅ CSRF token validation
✅ Rate limiting bypass
✅ Mass assignment vulnerability
✅ Authorization header manipulation
... (12 total tests)
```

### AI Payload Generator

**Generate custom attack payloads:**

| Payload Type | Tokens | Payloads | Customization |
|--------------|--------|----------|---------------|
| **SQLi** | ~4,000 | 50-100 | Database type, context |
| **XSS** | ~3,500 | 40-80 | Output context, filters |
| **Auth Bypass** | ~4,500 | 30-60 | Auth mechanism |
| **API Fuzzing** | ~5,000 | 60-120 | API structure, params |

**Example:**
```
Target: Login form with MySQL backend

Payload Generation (~4K tokens):
✅ 75 MySQL-specific SQLi payloads
✅ Context-aware (POST body, JSON format)
✅ Bypass techniques (comments, encoding)
✅ Time-based blind SQLi variants
✅ Boolean-based payloads
✅ Union-based injection
```

### Dork Generator

**Generate OSINT search queries:**

| Platform | Tokens | Dorks | Coverage |
|----------|--------|-------|----------|
| **Google** | ~2,500 | 15-25 | Files, subdomains, info |
| **Shodan** | ~2,000 | 10-20 | Services, ports, vulns |
| **GitHub** | ~2,500 | 15-25 | Secrets, configs, code |
| **All Platforms** | ~5,000 | 40-60 | Comprehensive |

**Example:**
```
Target: example.com

Dork Generation (~5K tokens):
Google:
✅ site:example.com filetype:pdf
✅ site:example.com inurl:admin
✅ site:example.com ext:sql | ext:db
... (25 dorks)

Shodan:
✅ hostname:example.com
✅ ssl.cert.subject.cn:example.com
... (20 dorks)

GitHub:
✅ "example.com" password
✅ "example.com" api_key
... (25 dorks)
```

### Attack Chain Generator

**Discover multi-step exploitation paths:**

| Complexity | Tokens | Chains | Depth |
|------------|--------|--------|-------|
| **Simple** | ~6,000 | 2-4 chains | 2-3 steps |
| **Standard** | ~10,000 | 4-8 chains | 3-5 steps |
| **Complex** | ~15,000 | 8-15 chains | 5-10 steps |

**Example:**
```
Target: E-commerce application

Attack Chain Discovery (~10K tokens):

Chain 1: "Payment Bypass via Price Manipulation"
1. Create account (no validation)
2. Add premium product to cart
3. Modify price in checkout request (IDOR)
4. Complete purchase for $0.01
Impact: Complete payment bypass
Severity: CRITICAL

Chain 2: "Admin Account Takeover"
1. Register account with email admin@example.com
2. Request password reset
3. Intercept reset token (weak generation)
4. Race condition allows token reuse
5. Reset admin password
Impact: Full admin access
Severity: CRITICAL

... (8 total chains discovered)
```

---

## Pricing Plans

### FREE Plan

**50,000 tokens/month** (renews monthly)

**What you get:**
```
Daily allowance:
- ~6 Quick Scans OR
- ~3 Deep Scans OR
- ~4 Quick + 1 Deep (recommended hybrid)

Monthly capacity:
- ~185 Quick Scans OR
- ~93 Deep Scans OR
- ~120 Quick + 30 Deep (hybrid)

Plus:
- ~10 AI Test Suggestions
- ~10 Payload Generations
- ~5 Dork Generations
- ~3 Attack Chain Discoveries
```

**Best for:**
- Personal projects
- Learning and practice
- Bug bounty hobbyists
- Small-scale testing

**Limitations:**
- 50K tokens/month
- 5 projects max
- Community support only
- No priority processing

---

### PRO Plan

**$29/month - 500,000 tokens/month** (renews monthly)

**What you get:**
```
Daily allowance:
- ~60 Quick Scans OR
- ~30 Deep Scans OR
- ~40 Quick + 15 Deep

Monthly capacity:
- ~1,850 Quick Scans OR
- ~930 Deep Scans OR
- ~1,200 Quick + 300 Deep

Plus:
- ~100 AI Test Suggestions
- ~100 Payload Generations
- ~50 Dork Generations
- ~30 Attack Chain Discoveries
```

**Best for:**
- Professional penetration testers
- Active bug bounty hunters
- Security consultants
- Small security teams

**Benefits:**
- 500K tokens/month (10× FREE)
- Unlimited projects
- Priority AI processing (2× faster)
- Email support (24h response)
- Export reports (PDF, JSON, CSV)
- API access

**ROI Example:**
```
Scenario: Bug bounty hunter

Findings per month:
- 3 medium bugs ($150 each) = $450
- 1 high bug = $500
Total: $950/month

Cost: $29/month
Profit: $921/month
ROI: 3,180%
```

---

### ENTERPRISE Plan

**Custom pricing - Starting at $199/month**

**Custom token allocation** (500K - 5M+/month)

**What you get:**
```
Everything in PRO, plus:
- Custom token packages
- Dedicated account manager
- Priority support (4h response)
- Live chat support
- Custom integrations
- Team collaboration features
- SSO/SAML authentication
- Audit logs
- SLA guarantee (99.9% uptime)
- White-label options
```

**Best for:**
- Enterprise security teams
- Security consulting firms
- Large-scale penetration testing
- Compliance and auditing
- Managed security service providers

**Custom Features:**
- Volume discounts (up to 40% off)
- Dedicated AI instances
- Custom rate limits
- Private deployment options
- Training and onboarding
- Custom feature development

**Contact sales:** enterprise@reqsploit.com

---

## Token Tracking

### Real-Time Balance

**View your token balance anytime:**
```
┌─────────────────────────────────────┐
│  💰 TOKEN BALANCE                   │
│                                      │
│  Current: 32,450 / 50,000           │
│  [████████████████░░░░░░░] 65%      │
│                                      │
│  Daily usage: 5,230 tokens          │
│  Renews: Dec 1, 2025 (7 days)       │
│                                      │
│  [View Usage] [Upgrade Plan]        │
└─────────────────────────────────────┘
```

**Access via:**
- Top-right user menu → "Token Balance"
- Dashboard widget
- Settings → Billing

### Usage History

**Detailed breakdown of token consumption:**
```
┌─────────────────────────────────────────────────┐
│  📊 TOKEN USAGE HISTORY (Last 30 days)         │
├─────────────────────────────────────────────────┤
│  Date       Feature         Tokens    Balance  │
│  ─────────────────────────────────────────────  │
│  Nov 20     Deep Scan       -16,234   32,450   │
│             POST /api/pay...                    │
│  Nov 20     Quick Scan      -8,124    48,684   │
│             GET /api/user...                    │
│  Nov 19     AI Payloads     -4,567    56,808   │
│             SQLi for login                      │
│  Nov 19     Test Suggest    -5,123    61,375   │
│             POST /api/admin                     │
│  Nov 18     Deep Scan       -15,890   66,498   │
│             POST /checkout                      │
│  Nov 1      Renewal         +50,000   50,000   │
│             Monthly refill                      │
│  ─────────────────────────────────────────────  │
│  Total Used: 17,550 tokens (35% of monthly)    │
│  Average: ~1,264 tokens/day                     │
│  Projected: ~37,920 tokens by month end         │
│                                                  │
│  [Export CSV] [View Charts]                    │
└─────────────────────────────────────────────────┘
```

### Usage Analytics

**Visualize your token consumption:**
```
┌─────────────────────────────────────┐
│  📈 USAGE ANALYTICS                 │
│                                      │
│  By Feature:                        │
│  Quick Scans:    45% (22,500 tokens)│
│  Deep Scans:     35% (17,500 tokens)│
│  Test Suggest:   12% (6,000 tokens) │
│  AI Payloads:    8% (4,000 tokens)  │
│                                      │
│  Most Scanned Endpoints:            │
│  1. POST /api/auth/login (12 scans) │
│  2. POST /api/checkout (8 scans)    │
│  3. GET /api/admin/users (6 scans)  │
│                                      │
│  Peak Usage Hours:                  │
│  14:00-16:00 (45% of daily tokens)  │
│                                      │
│  [Detailed Report]                  │
└─────────────────────────────────────┘
```

---

## Optimization Strategies

### 1. Strategic Scanning

**✅ Hybrid Approach:**
```
Step 1: Quick Scan all endpoints
- Identifies obvious vulnerabilities
- Low token cost per endpoint
- Broad coverage

Step 2: Deep Scan only interesting findings
- Thorough analysis of promising targets
- Higher token cost, better ROI
- Focused investigation

Result: 30-50% token savings with better results
```

**Example:**
```
Target: 20 API endpoints

Inefficient approach:
20 Deep Scans × 16K = 320,000 tokens

Optimized approach:
- 20 Quick Scans × 8K = 160,000 tokens
- 5 Deep Scans × 16K = 80,000 tokens
Total: 240,000 tokens (25% savings)
Plus: Better triage and focus
```

### 2. Feature Selection

**Choose the right AI feature for your need:**

| Need | Feature | Tokens | Alternative |
|------|---------|--------|-------------|
| Initial assessment | Quick Scan | 8K | Manual review |
| Detailed analysis | Deep Scan | 16K | Quick Scan first |
| Test ideas | AI Test Suggest | 5K | Manual test design |
| Payload creation | AI Payload Gen | 4K | Manual payload lists |
| OSINT | Dork Generator | 5K | Manual dork creation |
| Complex attacks | Attack Chains | 10K | Manual attack planning |

**Decision Tree:**
```
Need security analysis?
├─ Yes → Is endpoint critical?
│   ├─ Yes → Deep Scan (16K)
│   └─ No → Quick Scan (8K)
└─ No → Need test cases?
    ├─ Yes → AI Test Suggest (5K)
    └─ No → Need payloads?
        ├─ Yes → AI Payload Gen (4K)
        └─ No → Manual testing (0 tokens)
```

### 3. Batch Similar Requests

**Avoid duplicate scans:**

```
❌ Inefficient:
- Scan GET /api/users/1 (8K tokens)
- Scan GET /api/users/2 (8K tokens)
- Scan GET /api/users/3 (8K tokens)
Total: 24K tokens for same vulnerability

✅ Efficient:
- Scan GET /api/users/1 (8K tokens)
- Manually test /users/2, /users/3
Total: 8K tokens, same coverage
```

### 4. Learn from AI Results

**Apply AI insights to manual testing:**

```
Scan 1: POST /api/products/create
AI Finding: "Missing authorization check"

Apply to similar endpoints (no scan needed):
- POST /api/products/update
- POST /api/products/delete
- POST /api/categories/create
- POST /api/categories/update

Result: 1 scan (16K tokens) reveals 5 vulnerabilities
Savings: 64K tokens (80% reduction)
```

### 5. Time Your Scans

**Optimize for your workflow:**

```
✅ Efficient timing:
- End of testing session: Review all findings
- Before report submission: Deep Scan critical
- After manual testing: Validate findings

❌ Inefficient timing:
- Scan every request immediately
- Rescan same endpoint multiple times
- Scan before manual exploration
```

### 6. Use Free Features First

**Maximize free features before using tokens:**

```
Free features (0 tokens):
✅ Request capture and history
✅ Intercept mode
✅ Repeater manual testing
✅ Intruder fuzzing (with manual payloads)
✅ Decoder
✅ Magic Scan (pattern-based, no AI)
✅ Tags and organization

AI features (tokens required):
💰 Quick/Deep Scan
💰 AI Test Suggestions
💰 AI Payload Generator
💰 Dork Generator
💰 Attack Chain Generator

Strategy: Exhaust free features first, use AI for validation and advanced analysis
```

---

## Token Renewal

### Monthly Renewal

**FREE Plan:**
- Tokens reset to 50,000 on the 1st of each month
- Unused tokens do NOT roll over
- Renewal is automatic

**PRO Plan:**
- Tokens reset to 500,000 on your billing date
- Unused tokens do NOT roll over
- Auto-renewal with credit card

**Example:**
```
FREE Plan - Joined Nov 15:
- Nov 15: 50,000 tokens granted
- Nov 30: 12,000 tokens remaining
- Dec 1: Reset to 50,000 tokens (12K lost)

PRO Plan - Joined Nov 15:
- Nov 15: 500,000 tokens granted
- Dec 14: 120,000 tokens remaining
- Dec 15: Reset to 500,000 tokens (120K lost)
```

### Token Rollovers (PRO/Enterprise only)

**Coming Soon:** Token banking feature
- Roll over up to 100,000 unused tokens (PRO)
- Roll over up to 1,000,000 unused tokens (Enterprise)
- Maximum 2× monthly allocation

### Buy Additional Tokens

**One-time token purchase:**

| Package | Tokens | Price | Cost per 1K |
|---------|--------|-------|-------------|
| **Small** | 50,000 | $15 | $0.30 |
| **Medium** | 150,000 | $39 | $0.26 |
| **Large** | 500,000 | $99 | $0.20 |
| **Bulk** | 2,000,000 | $299 | $0.15 |

**Usage:**
- Add-on to any plan
- Never expires
- Used after monthly tokens
- Perfect for occasional high usage

**Example:**
```
FREE Plan + Small Package:
- Monthly: 50,000 tokens (renews)
- Add-on: 50,000 tokens (permanent)
- Total: 100,000 tokens available

Usage priority:
1. Use monthly tokens first (50K)
2. Then use add-on tokens (50K)
3. Next month: Monthly tokens renew (50K + remaining add-on)
```

---

## Frequently Asked Questions

### General Questions

**Q: Do unused tokens roll over to next month?**
A: No, monthly tokens reset on renewal date. Consider purchasing add-on token packages if you need rollover.

**Q: Can I upgrade/downgrade my plan mid-month?**
A: Yes! Upgrades are prorated and take effect immediately. Downgrades take effect at next renewal.

**Q: What happens if I run out of tokens?**
A: AI features become unavailable until renewal or you purchase add-on tokens. All other features still work.

**Q: Can I share tokens with team members?**
A: Enterprise plans support team token pools. PRO and FREE are individual accounts.

### Usage Questions

**Q: How do I see exactly how many tokens each scan used?**
A: Check "Token Usage History" in Settings → Billing for detailed breakdown per operation.

**Q: Why did my scan use more tokens than estimated?**
A: Large requests/responses and complex findings increase token usage. Estimates are averages.

**Q: Can I set token usage limits?**
A: Yes! Set daily/weekly limits in Settings → Billing → Usage Limits to prevent overuse.

### Billing Questions

**Q: What payment methods do you accept?**
A: Credit/debit cards (Visa, Mastercard, Amex), PayPal, and crypto (Enterprise).

**Q: Is there a refund policy?**
A: 30-day money-back guarantee on PRO plan, no questions asked.

**Q: Can I cancel anytime?**
A: Yes, cancel anytime from Settings → Billing. Access continues until end of billing period.

**Q: Do you offer discounts?**
A: Yes! Students (50% off), nonprofits (30% off), annual plans (20% off).

---

## Next Steps

Now that you understand the token system:

1. ✅ **[View Pricing Plans](https://reqsploit.com/pricing)** - Compare plans and upgrade
2. ✅ **[Optimize Usage](./overview.md)** - Learn AI features in depth
3. ✅ **[Start Testing](../getting-started/quick-start.md)** - Put your tokens to work
4. ✅ **[Track Usage](https://reqsploit.com/dashboard/billing)** - Monitor token consumption

---

**Need Help?** Check the [FAQ](../troubleshooting/faq.md) or [contact support](mailto:support@reqsploit.com).

**Ready to upgrade?** Visit [reqsploit.com/pricing](https://reqsploit.com/pricing) to choose your plan!
