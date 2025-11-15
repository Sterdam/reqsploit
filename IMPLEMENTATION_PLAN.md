# 🎯 ReqSploit - Plan d'Implémentation Complet

## 📋 Architecture Modulaire & Scalable

### Phase 1: Fondations Data (2-3h) ✅ DONE
- ✅ Base de données PostgreSQL avec Prisma
- ✅ Schema complet (users, sessions, requests, analyses)
- ✅ Migrations appliquées
- ✅ Auth JWT + refresh tokens
- ✅ Container Docker harmonisé

### Phase 2: Système de Stockage Intelligent (NEXT - 3h)

#### 2.1 Schema Database Complet
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  plan          Plan      @default(FREE)
  tokensUsed    Int       @default(0)
  tokensLimit   Int       @default(10000)
  createdAt     DateTime  @default(now())

  // Relations
  sessions      ProxySession[]
  requests      RequestLog[]
  analyses      AIAnalysis[]
  projects      Project[]
  settings      UserSettings?
}

model Project {
  id          String    @id @default(uuid())
  userId      String
  name        String
  description String?
  target      String    // Base URL
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
  requests    RequestLog[]
  findings    Finding[]
}

model RequestLog {
  id          String    @id @default(uuid())
  userId      String
  projectId   String?
  sessionId   String
  method      String
  url         String
  headers     Json
  body        String?
  response    Response?
  timestamp   DateTime  @default(now())
  tags        String[]  @default([])
  starred     Boolean   @default(false)

  user        User      @relation(fields: [userId], references: [id])
  project     Project?  @relation(fields: [projectId], references: [id])
  session     ProxySession @relation(fields: [sessionId], references: [id])
  analyses    AIAnalysis[]

  @@index([userId, timestamp])
  @@index([projectId])
}

model Response {
  id          String    @id @default(uuid())
  requestId   String    @unique
  statusCode  Int
  headers     Json
  body        String?
  size        Int
  duration    Int       // ms
  timestamp   DateTime  @default(now())

  request     RequestLog @relation(fields: [requestId], references: [id])
}

model AIAnalysis {
  id            String      @id @default(uuid())
  userId        String
  requestId     String
  mode          AIMode      // EDUCATIONAL, DEFAULT, ADVANCED
  analysis      Json
  vulnerabilities Vulnerability[]
  suggestions   Json
  tokensUsed    Int
  confidence    Float
  createdAt     DateTime    @default(now())

  user          User        @relation(fields: [userId], references: [id])
  request       RequestLog  @relation(fields: [requestId], references: [id])

  @@index([userId])
  @@index([requestId])
}

model Vulnerability {
  id          String      @id @default(uuid())
  analysisId  String
  type        VulnType    // SQLi, XSS, IDOR, etc.
  severity    Severity    // CRITICAL, HIGH, MEDIUM, LOW
  title       String
  description String
  evidence    Json
  remediation String
  cwe         String?
  cvss        Float?

  analysis    AIAnalysis  @relation(fields: [analysisId], references: [id])
}

model Finding {
  id          String    @id @default(uuid())
  projectId   String
  title       String
  description String
  severity    Severity
  status      Status    @default(OPEN)
  proof       Json      // Screenshots, requests, etc.
  createdAt   DateTime  @default(now())

  project     Project   @relation(fields: [projectId], references: [id])
}

enum AIMode {
  EDUCATIONAL
  DEFAULT
  ADVANCED
}

enum VulnType {
  SQLi
  XSS
  IDOR
  SSRF
  XXE
  RCE
  LFI
  SSTI
  CSRF
  CORS
  JWT_WEAK
  AUTH_BYPASS
  INFO_DISCLOSURE
  CUSTOM
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  INFO
}

enum Status {
  OPEN
  IN_PROGRESS
  RESOLVED
  FALSE_POSITIVE
}
```

#### 2.2 Services de Gestion des Données

**RequestLogService** (`/backend/src/services/request-log.service.ts`)
- Stockage centralisé de toutes les requêtes
- Indexation pour recherche rapide
- Filtres avancés (date, méthode, URL, tags)
- Export PDF/JSON/CSV

**ProjectService** (`/backend/src/services/project.service.ts`)
- Organisation par projet/cible
- Gestion collaborative
- Statistics par projet

**AnalysisService** (`/backend/src/services/analysis.service.ts`)
- Historique complet des analyses AI
- Cache des résultats
- Rejeu d'analyses

### Phase 3: Système AI Intelligent (4-5h)

#### 3.1 Architecture AI à 3 Modes

**Mode EDUCATIONAL** 🎓
```typescript
// For beginners and learning
interface EducationalMode {
  verbosity: 'high';
  explain: true;
  includeResources: true;
  stepByStep: true;

  prompts: {
    systemPrompt: `You are a web security mentor.
    Explain EVERYTHING in detail:
    - Why this is a vulnerability
    - How it works technically
    - What are the risks and impact
    - How to exploit it (educational purpose)
    - How to fix/remediate it
    - Resources to learn more`;

    analysis: {
      format: 'detailed_explanation';
      includeContext: true;
      includeLinks: true;
      includeExamples: true;
    };
  };
}
```

**Mode DEFAULT** ⚡
```typescript
// For standard pentesting
interface DefaultMode {
  verbosity: 'balanced';
  explain: true;
  includeResources: false;
  stepByStep: false;

  prompts: {
    systemPrompt: `You are a professional pentesting assistant.
    Fast and actionable analysis:
    - Detect vulnerabilities
    - Suggest exploitation methods
    - Prioritize by severity
    - Provide ready-to-use payloads`;

    analysis: {
      format: 'actionable_findings';
      prioritize: true;
      includePayloads: true;
    };
  };
}
```

**Mode ADVANCED** 🔬
```typescript
// For experts and advanced research
interface AdvancedMode {
  verbosity: 'minimal';
  explain: false;
  includeResources: false;
  stepByStep: false;
  deepAnalysis: true;

  prompts: {
    systemPrompt: `You are an expert security researcher.
    Advanced technical analysis:
    - Advanced detection (race conditions, logic flaws)
    - Vulnerability chaining
    - Server-side code analysis
    - Fuzzing suggestions
    - Complex exploitation techniques`;

    analysis: {
      format: 'technical_report';
      includeChaining: true;
      includeFuzzing: true;
      includeBypass: true;
    };
  };
}
```

#### 3.2 Attack Surface Analyzer

**Détection Intelligente**
```typescript
interface AttackSurfaceAnalysis {
  // Paramètres analysés
  parameters: {
    query: string[];
    body: string[];
    headers: string[];
    cookies: string[];
    path: string[];
  };

  // Surface d'attaque par type
  surfaces: {
    injection: {
      sql: Parameter[];
      xss: Parameter[];
      command: Parameter[];
      template: Parameter[];
    };
    authentication: {
      weak_session: boolean;
      jwt_issues: JWTIssue[];
      csrf_vulnerable: boolean;
    };
    authorization: {
      idor_potential: boolean;
      privilege_escalation: boolean;
    };
    business_logic: {
      rate_limiting: boolean;
      price_manipulation: boolean;
      workflow_bypass: boolean;
    };
  };

  // Recommandations priorisées
  recommendations: Recommendation[];
}
```

**Context Builder pour Flow Complet**
```typescript
interface RequestContext {
  // Requêtes liées
  relatedRequests: {
    before: RequestLog[];  // Requêtes précédentes dans le flow
    after: RequestLog[];   // Requêtes suivantes
    similar: RequestLog[]; // Requêtes similaires
  };

  // Contexte applicatif
  appContext: {
    technology: string[];  // React, Laravel, etc.
    authentication: AuthType;
    sessionManagement: SessionType;
    apis: APIEndpoint[];
  };

  // Données utilisateur
  userData: {
    role: string;
    permissions: string[];
    tokens: Token[];
  };

  // Suggestions contextuelles
  suggestions: {
    modifications: RequestModification[];
    fuzzing: FuzzingStrategy[];
    exploitation: ExploitChain[];
  };
}
```

### Phase 4: Dashboard Complet (5-6h)

#### 4.1 Composants Réutilisables

**RequestList** - Liste intelligente avec filters
**RequestViewer** - Affichage request/response
**RequestEditor** - Monaco Editor avec syntax highlighting
**AIAnalysisPanel** - Panneau AI avec 3 modes
**ProxyControls** - Start/Stop/Intercept
**FindingsPanel** - Gestion des findings
**ProjectSelector** - Organisation par projet

#### 4.2 Features Dashboard
- WebSocket real-time pour nouvelles requêtes
- Filtres avancés (regex, status, taille, durée)
- Recherche full-text dans requêtes
- Tags et favoris
- Export masse
- Timeline des requêtes
- Graphiques de stats

### Phase 5: Extension Chrome (6-8h)

#### 5.1 Manifest V3
```json
{
  "manifest_version": 3,
  "name": "ReqSploit",
  "description": "AI-Powered MITM Proxy for Pentesters",
  "version": "1.0.0",
  "permissions": [
    "proxy",
    "storage",
    "tabs",
    "webRequest"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}
```

#### 5.2 Features Extension
- Configuration proxy automatique
- Download certificat SSL one-click
- Status du proxy (ON/OFF)
- Compteur de requêtes interceptées
- Quick actions
- Token balance visible

### Phase 6: Stripe & Billing (3-4h)

#### 6.1 Backend Routes
- POST /api/billing/create-checkout-session
- POST /api/billing/webhook
- GET /api/billing/subscription
- POST /api/billing/cancel
- POST /api/billing/update-payment-method

#### 6.2 Frontend Integration
- Upgrade flow
- Payment success/cancel pages
- Billing portal
- Invoice download

### Phase 7: Testing & Polish (2-3h)

- E2E test complet du workflow
- Performance testing
- UX polish
- Documentation utilisateur

---

## 📊 Timeline Réaliste

**Total: 25-32 heures de dev**

| Phase | Temps | Priority |
|-------|-------|----------|
| ✅ Phase 1: Fondations | 3h | DONE |
| 🔄 Phase 2: Data Storage | 3h | HIGH |
| Phase 3: AI System | 5h | CRITICAL |
| Phase 4: Dashboard | 6h | HIGH |
| Phase 5: Extension | 8h | MEDIUM |
| Phase 6: Stripe | 4h | MEDIUM |
| Phase 7: Testing | 3h | HIGH |

---

## 🎯 Next Immediate Actions

1. **Créer le schema Prisma complet** avec tous les modèles
2. **Migrer la database** avec les nouvelles tables
3. **Implémenter les 3 modes AI** avec prompts optimisés
4. **Créer RequestLogService** pour stockage centralisé
5. **Builder les composants Dashboard** un par un
