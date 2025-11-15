# PENTEST AI PROXY - Plan de Projet Complet

## 🎯 Vision & Positionnement

### Concept
**PentestAI Proxy** - Un proxy MITM intelligent qui assiste les pentesters en temps réel avec l'IA Claude pour détecter des vulnérabilités, suggérer des modifications de requêtes et guider l'exploitation.

### Proposition de Valeur Unique
- ✨ **Assistant AI contextuel** à chaque étape du pentest
- 🚀 **Friction minimale** : installation en 3 clics
- 💡 **Suggestions proactives** : Claude analyse automatiquement les requêtes/réponses
- 🎓 **Apprentissage** : explications pédagogiques pour juniors pentesters
- ⚡ **Performance** : architecture moderne, réactive, temps réel

### Différenciation vs Burp Suite
| Feature | Burp Suite | PentestAI Proxy |
|---------|------------|-----------------|
| AI Assistant | ❌ | ✅ Intelligence contextuelle |
| Setup | Complexe | 3 clics + certificat |
| Interface | Java/Swing | Web moderne/réactive |
| Collaboration | Pro only | Natif multi-user |
| Prix | $449/an | Freemium + tokens |
| Learning curve | Élevée | Guidé par AI |

---

## 🏗️ Architecture Technique

### Vue d'Ensemble

```
┌─────────────────┐
│  User Browser   │
│  + Extension    │
└────────┬────────┘
         │ HTTPS (via proxy)
         ↓
┌─────────────────┐         ┌──────────────┐
│   VPS Proxy     │←─WS────→│   Frontend   │
│   (MITM Core)   │         │   (Dashboard)│
└────────┬────────┘         └──────────────┘
         │
         ↓
┌─────────────────┐
│  Target Websites│
└─────────────────┘

Backend Services:
- Authentication & User Management
- Token Management (AI usage)
- Session Management
- Database (logs, history)
- Claude API Integration
- WebSocket Server (real-time)
```

### Stack Technique

#### Backend (Node.js)
- **Framework**: Express.js + TypeScript
- **Proxy MITM**: `http-proxy` + `node-mitmproxy`
- **WebSocket**: `socket.io` (bi-directionnel, reconnexion auto)
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (sessions, rate limiting)
- **AI**: Anthropic Claude API (Sonnet 4.5)
- **Auth**: JWT + refresh tokens
- **SSL**: `node-forge` (génération certificats dynamiques)

#### Frontend (React)
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State**: Zustand + React Query
- **UI**: Tailwind CSS + shadcn/ui
- **WS Client**: socket.io-client
- **HTTP Client**: axios
- **Code Editor**: Monaco Editor (modification requêtes)
- **Diff Viewer**: react-diff-viewer-continued

#### Extension Chrome
- **Manifest**: V3
- **Language**: TypeScript
- **Bundler**: webpack
- **APIs**: 
  - `chrome.proxy` (configuration automatique)
  - `chrome.storage` (token, config)
  - `chrome.tabs` (injection context)

#### Infrastructure
- **Containerisation**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (SSL termination, load balancing)
- **Monitoring**: Prometheus + Grafana
- **Logs**: Winston + Loki
- **CI/CD**: GitHub Actions

---

## 📦 Structure des Composants

### 1. Backend (`/backend`)

```
backend/
├── src/
│   ├── core/
│   │   ├── proxy/
│   │   │   ├── mitm-proxy.ts         # Proxy MITM principal
│   │   │   ├── certificate-manager.ts # Génération certs SSL
│   │   │   ├── interceptor.ts        # Logique interception
│   │   │   └── request-modifier.ts   # Modification requêtes
│   │   ├── websocket/
│   │   │   ├── ws-server.ts          # Serveur WebSocket
│   │   │   ├── events.ts             # Events typés
│   │   │   └── handlers.ts           # Handlers par type
│   │   └── ai/
│   │       ├── claude-client.ts      # Client Anthropic API
│   │       ├── analyzers/
│   │       │   ├── request-analyzer.ts   # Analyse requêtes
│   │       │   ├── response-analyzer.ts  # Analyse réponses
│   │       │   ├── vulnerability-detector.ts # Détection vulns
│   │       │   └── exploit-suggester.ts    # Suggestions exploits
│   │       └── prompts/
│   │           ├── system-prompts.ts     # Prompts système
│   │           └── context-builder.ts    # Construction contexte
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── proxy.routes.ts
│   │   │   ├── history.routes.ts
│   │   │   ├── tokens.routes.ts
│   │   │   └── ai.routes.ts
│   │   └── middlewares/
│   │       ├── auth.middleware.ts
│   │       ├── rate-limit.middleware.ts
│   │       └── token-check.middleware.ts
│   ├── database/
│   │   ├── schema.prisma             # Schema Prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── token.service.ts          # Gestion tokens AI
│   │   ├── session.service.ts
│   │   └── history.service.ts
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── validators.ts
├── tests/
├── docker/
│   ├── Dockerfile
│   └── Dockerfile.prod
├── package.json
└── tsconfig.json
```

### 2. Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── proxy/
│   │   │   ├── RequestList.tsx       # Liste requêtes interceptées
│   │   │   ├── RequestDetails.tsx    # Détails requête
│   │   │   ├── ResponseViewer.tsx    # Viewer réponse
│   │   │   ├── RequestEditor.tsx     # Éditeur modification
│   │   │   └── InterceptionToggle.tsx
│   │   ├── ai/
│   │   │   ├── AIPanel.tsx           # Panneau AI assistant
│   │   │   ├── SuggestionCard.tsx    # Cartes suggestions
│   │   │   ├── VulnerabilityAlert.tsx
│   │   │   ├── ContextInput.tsx      # Input contexte custom
│   │   │   └── AISettings.tsx        # Config AI (auto/manual)
│   │   ├── history/
│   │   │   ├── HistoryList.tsx
│   │   │   ├── HistoryFilters.tsx
│   │   │   └── HistoryExport.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── CodeEditor.tsx
│   │       └── DiffViewer.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Proxy.tsx                 # Page principale proxy
│   │   ├── History.tsx
│   │   ├── Settings.tsx
│   │   ├── Tokens.tsx                # Gestion tokens AI
│   │   └── Auth/
│   │       ├── Login.tsx
│   │       └── Register.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useProxy.ts
│   │   ├── useAI.ts
│   │   └── useAuth.ts
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── proxy.store.ts
│   │   ├── ai.store.ts
│   │   └── ui.store.ts
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── ws.service.ts
│   │   └── storage.service.ts
│   ├── types/
│   │   ├── request.types.ts
│   │   ├── response.types.ts
│   │   ├── ai.types.ts
│   │   └── user.types.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── helpers.ts
├── public/
├── package.json
└── vite.config.ts
```

### 3. Extension Chrome (`/extension`)

```
extension/
├── src/
│   ├── background/
│   │   ├── service-worker.ts         # Service worker MV3
│   │   ├── proxy-manager.ts          # Gestion config proxy
│   │   └── auth-manager.ts
│   ├── popup/
│   │   ├── Popup.tsx                 # UI popup
│   │   ├── components/
│   │   │   ├── ProxyStatus.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── TokenBadge.tsx
│   │   └── popup.html
│   ├── content/
│   │   └── content-script.ts         # Injection contexte (optionnel)
│   ├── shared/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── storage.ts
│   └── utils/
│       └── api-client.ts
├── public/
│   ├── manifest.json                 # Manifest V3
│   ├── icons/
│   └── _locales/
├── webpack.config.js
└── package.json
```

---

## 🔐 Sécurité & Infrastructure

### Certificats SSL MITM

#### Génération
```typescript
// Certificat racine (Root CA) par utilisateur
interface RootCA {
  cert: string;      // PEM
  key: string;       // PEM privée
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

// Certificats dynamiques par domaine
interface DomainCert {
  domain: string;
  cert: string;
  key: string;
  signedBy: string;  // rootCA.cert
  ttl: number;       // 24h cache
}
```

#### Installation Utilisateur
1. User s'inscrit → Backend génère Root CA unique
2. Download automatique du `.crt` via extension
3. Guide interactif OS-specific :
   - **Windows**: certmgr.msc → Trusted Root
   - **macOS**: Keychain Access
   - **Linux**: update-ca-certificates

### Multi-Utilisateurs & Isolation

```typescript
// Session proxy par utilisateur
interface ProxySession {
  userId: string;
  sessionId: string;
  proxyPort: number;        // Port dynamique unique
  wsConnection: WebSocket;
  interceptMode: boolean;
  filters: RequestFilters;
  aiSettings: AISettings;
}

// Allocation dynamique de ports
// User 1: proxy sur port 8001
// User 2: proxy sur port 8002
// etc.
```

### Authentification & Tokens

```typescript
// JWT Access Token (15min)
interface AccessToken {
  userId: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  exp: number;
}

// Refresh Token (7 jours, rotation)
interface RefreshToken {
  userId: string;
  tokenId: string;
  exp: number;
}

// AI Usage Token
interface AIToken {
  userId: string;
  balance: number;          // Tokens restants
  plan: string;
  resetDate: Date;          // Reset mensuel
}
```

---

## 🤖 Intégration AI (Claude)

### Contexte AI à Chaque Étape

#### 1. Analyse Automatique (Background)
```typescript
interface AutoAnalysis {
  trigger: 'on_request' | 'on_response';
  enabled: boolean;
  types: ('vulnerability' | 'optimization' | 'security')[];
}

// Exemple: nouvelle requête interceptée
Request → AI analyze → Suggestions silencieuses dans UI
```

#### 2. Analyse à la Demande
```typescript
interface ManualAnalysis {
  requestId: string;
  contextText?: string;      // Contexte custom utilisateur
  analysisType: 'deep' | 'quick' | 'exploit' | 'explain';
  streaming: boolean;        // Stream réponse AI
}
```

#### 3. Suggestions Contextuelles

```typescript
interface AISuggestion {
  id: string;
  type: 'vulnerability' | 'exploit' | 'modification' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  context: {
    request: HTTPRequest;
    response?: HTTPResponse;
    relatedRequests: string[];  // IDs requêtes liées
  };
  actions: SuggestedAction[];
  confidence: number;           // 0-100
  tokens_used: number;
}

interface SuggestedAction {
  label: string;
  type: 'modify' | 'repeat' | 'copy' | 'learn_more';
  payload: {
    modifiedRequest?: HTTPRequest;
    explanation?: string;
    resources?: Link[];
  };
}
```

### Prompts Système Intelligents

```typescript
// Prompt adaptatif selon contexte
function buildAIPrompt(context: AnalysisContext): string {
  const basePrompt = `Tu es un expert en sécurité web et pentest...`;
  
  // + Contexte de la requête
  // + Historique récent utilisateur
  // + Contexte custom si fourni
  // + Mode d'analyse (quick/deep)
  
  return constructedPrompt;
}
```

### Exemples d'Assistance AI

#### Cas 1: Détection SQLi
```
User intercepte: GET /api/users?id=1

AI détecte:
┌────────────────────────────────────┐
│ 🚨 Vulnérabilité Potentielle       │
├────────────────────────────────────┤
│ Type: SQL Injection                │
│ Sévérité: CRITICAL                 │
│ Confiance: 87%                     │
├────────────────────────────────────┤
│ Le paramètre 'id' semble vulnérable│
│ Actions suggérées:                 │
│  1. ✏️ Tester: id=1' OR '1'='1     │
│  2. 🔍 Scanner fuzzing automatique │
│  3. 📚 En savoir plus sur SQLi     │
└────────────────────────────────────┘
```

#### Cas 2: Modification Guidée
```
User veut modifier une requête JWT

AI suggère:
┌────────────────────────────────────┐
│ 💡 Modification JWT                │
├────────────────────────────────────┤
│ J'ai détecté un JWT dans le header │
│ Authorization. Voici ce que tu peux│
│ tester:                            │
│                                    │
│ 1. Changer l'algo en "none"       │
│ 2. Modifier le payload (role)     │
│ 3. Tester signature invalide      │
│                                    │
│ [Appliquer mod 1] [Tout tester]   │
└────────────────────────────────────┘
```

### Coûts & Gestion Tokens

```typescript
// Pricing AI (estimation)
const AI_COSTS = {
  quick_analysis: 500,      // tokens
  deep_analysis: 2000,
  exploit_suggestion: 1500,
  explain: 800,
  auto_background: 300,     // Par requête si enabled
};

// Plans
const PLANS = {
  free: {
    price: 0,
    tokens_monthly: 10000,    // ~20 analyses deep
    features: ['basic_analysis', 'manual_only'],
  },
  pro: {
    price: 29,                // $/mois
    tokens_monthly: 100000,   // ~200 analyses deep
    features: ['auto_analysis', 'deep_scan', 'history'],
  },
  enterprise: {
    price: 99,
    tokens_monthly: 500000,
    features: ['all', 'priority', 'custom_prompts'],
  },
};
```

---

## 🎨 UX/UI Sans Friction

### Onboarding (< 3 minutes)

```
Étape 1: Inscription (30s)
  → Email + Password
  → Confirmation email

Étape 2: Installation Extension (30s)
  → Bouton "Installer Extension"
  → Chrome Web Store → Install
  → Extension auto-configure

Étape 3: Certificat SSL (90s)
  → Download automatique depuis extension
  → Guide visuel OS-détecté:
    [Windows] [macOS] [Linux]
  → Vidéo 30s pour chaque OS
  → Vérification: "Tester la connexion"

Étape 4: Premier Proxy (30s)
  → Extension active proxy auto
  → Dashboard affiche: "Prêt! 🎉"
  → Mini-tutoriel interactif
```

### Interface Principale (Dashboard)

```
┌─────────────────────────────────────────────────────┐
│ [Logo] PentestAI    [Profile] [Tokens: 8,450] [⚙️] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ 🟢 Proxy ON  │  │  AI Assistant              │  │
│  │ Port: 8001   │  │  ┌─────────────────────┐  │  │
│  │ Intercept: ✓ │  │  │ 💡 3 suggestions    │  │  │
│  └──────────────┘  │  │ 🚨 1 vulnérabilité  │  │  │
│                    │  └─────────────────────┘  │  │
│  Requests (Live)   │  [Contexte custom...]    │  │
│  ┌──────────────┐  │  [Analyser] [Settings]   │  │
│  │ GET /api/... │  └───────────────────────────┘  │
│  │ POST /login  │                                 │
│  │ GET /users   │  Request Details                │
│  └──────────────┘  ┌──────────────────────────┐  │
│  [Filter] [Clear]  │ GET /api/users?id=1      │  │
│                    │ Host: example.com         │  │
│  History          │ ...                       │  │
│  [View All]        │ [Modify] [Repeat] [AI]   │  │
│                    └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Réduction Friction

1. **Auto-configuration proxy**
   - Extension configure Chrome automatiquement
   - Pas de config manuelle PAC/system proxy

2. **Certificat simplifié**
   - Download one-click
   - Guides visuels pas-à-pas
   - Vérification intégrée

3. **Zero-config AI**
   - Suggestions automatiques par défaut
   - Juste un toggle on/off

4. **Contexte intelligent**
   - AI comprend l'historique
   - Pas besoin de réexpliquer à chaque fois

5. **Actions rapides**
   - Boutons "Appliquer suggestion"
   - Keyboard shortcuts
   - Templates de requêtes

---

## 💰 Business Model

### Stratégie Freemium

#### Tier FREE (Acquisition)
- ✅ Proxy MITM complet
- ✅ 10,000 tokens AI/mois (~20 analyses)
- ✅ Historique 7 jours
- ✅ 1 session simultanée
- ❌ Analyse automatique background
- ❌ Export rapports
- ❌ Collaboration

**Objectif**: Acquisition, conversion vers Pro

#### Tier PRO ($29/mois)
- ✅ 100,000 tokens AI/mois
- ✅ Analyse automatique activée
- ✅ Historique 90 jours
- ✅ 5 sessions simultanées
- ✅ Export PDF/JSON
- ✅ Filtres avancés
- ✅ Support prioritaire

**Objectif**: Pentesters individuels, freelances

#### Tier ENTERPRISE ($99/mois)
- ✅ 500,000 tokens AI/mois
- ✅ Sessions illimitées
- ✅ Historique illimité
- ✅ Collaboration équipe
- ✅ API access
- ✅ Custom prompts AI
- ✅ SSO/SAML
- ✅ SLA & support dédié

**Objectif**: Équipes sécurité, cabinets conseil

### Monétisation Tokens

```typescript
// Achat tokens additionnels
const TOKEN_PACKS = {
  small: { tokens: 50000, price: 9 },    // $9
  medium: { tokens: 150000, price: 24 }, // $24 (20% réduction)
  large: { tokens: 500000, price: 70 },  // $70 (30% réduction)
};

// Rollover tokens non-utilisés (Pro+)
// Pas d'expiration pour Enterprise
```

### Projections Financières (Année 1)

```
Mois 1-3: Lancement + Marketing
  - 0 → 100 users FREE
  - 0 → 5 users PRO
  - MRR: $145

Mois 6:
  - 500 FREE
  - 50 PRO
  - 5 ENTERPRISE
  - MRR: $1,945

Mois 12:
  - 2000 FREE
  - 200 PRO (10% conversion)
  - 20 ENTERPRISE
  - MRR: $7,780

Coûts:
  - VPS: ~$50/mois (scaling progressif)
  - Anthropic API: ~$500-1500/mois (selon usage)
  - Total: ~$2000/mois max

Profit Année 1: ~$50k (conservatif)
```

### Acquisition Clients

1. **Content Marketing**
   - Blog: tutoriels pentest
   - YouTube: démos
   - GitHub: repos open-source tools

2. **Community**
   - Discord serveur
   - Reddit: r/netsec, r/bugbounty
   - Twitter/X: thread techniques

3. **Partenariats**
   - Plateformes bug bounty (HackerOne, etc.)
   - Bootcamps cybersécurité
   - Influenceurs pentest

4. **Product Hunt Launch**
   - Featured = 1000+ signups jour 1

---

## 📊 Métriques de Succès

### KPIs Techniques
- ⏱️ Latency proxy: < 50ms (P95)
- 🔄 Uptime: > 99.9%
- 🚀 Temps interception: < 5ms
- 📊 WebSocket reconnexion: < 1s
- 💾 Historique query: < 100ms

### KPIs Business
- 👥 MAU (Monthly Active Users)
- 💰 MRR (Monthly Recurring Revenue)
- 📈 Conversion FREE → PRO: > 8%
- 🔄 Churn rate: < 5%
- ⭐ NPS (Net Promoter Score): > 50
- 💬 Support tickets: < 1/user/mois

### KPIs Produit
- 🎯 Onboarding completion: > 80%
- ⚡ Time to first intercept: < 5min
- 🤖 AI suggestions accepted: > 40%
- 📊 Sessions/user/mois: > 15
- ⏰ Session duration: > 20min

---

## 🚀 Roadmap

### Phase 1: MVP (Semaines 1-4)
**Objectif**: Proxy fonctionnel + AI basique

- ✅ Backend proxy MITM
- ✅ Génération certificats SSL
- ✅ Extension Chrome (config proxy)
- ✅ Frontend dashboard basique
- ✅ WebSocket real-time
- ✅ Interception/modification requêtes
- ✅ Intégration Claude API (analyse manuelle)
- ✅ Auth JWT
- ✅ Base de données (users, sessions)
- ✅ Docker Compose local

**Livrable**: Version alpha testable en interne

### Phase 2: AI Intelligence (Semaines 5-6)
**Objectif**: Assistant AI complet

- ✅ Analyse automatique background
- ✅ Détection vulnérabilités (SQLi, XSS, etc.)
- ✅ Suggestions exploits
- ✅ Contexte custom utilisateur
- ✅ Système de tokens
- ✅ UI AI panel avancée
- ✅ Streaming réponses AI

**Livrable**: Beta privée avec AI fonctionnel

### Phase 3: UX & Onboarding (Semaine 7)
**Objectif**: Friction minimale

- ✅ Onboarding interactif
- ✅ Guide installation certificat
- ✅ Auto-configuration extension
- ✅ Tutoriel in-app
- ✅ Templates requêtes
- ✅ Keyboard shortcuts
- ✅ Dark mode

**Livrable**: Beta publique (early access)

### Phase 4: Production Ready (Semaine 8)
**Objectif**: Déploiement VPS

- ✅ Docker Compose production
- ✅ Nginx reverse proxy
- ✅ SSL/TLS (Let's Encrypt)
- ✅ Monitoring (Prometheus)
- ✅ Logs centralisés
- ✅ Backup automatique DB
- ✅ CI/CD GitHub Actions
- ✅ Tests e2e

**Livrable**: Production v1.0

### Phase 5: Monétisation (Semaine 9-10)
**Objectif**: Business model actif

- ✅ Stripe integration
- ✅ Plans FREE/PRO/ENTERPRISE
- ✅ Gestion tokens/facturation
- ✅ Tableau de bord admin
- ✅ Analytics usage
- ✅ Email notifications

**Livrable**: Lancement commercial

### Phase 6: Growth (Semaines 11-12)
**Objectif**: Scaling & features avancées

- ✅ Collaboration multi-users
- ✅ Export rapports (PDF/JSON)
- ✅ API publique
- ✅ Filtres avancés
- ✅ Scanner automatique vulns
- ✅ Marketplace plugins (futur)

**Livrable**: Version feature-complete

---

## 🔧 Configuration Technique

### Variables d'Environnement

```bash
# backend/.env
NODE_ENV=development|production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pentestai
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_MAX_TOKENS=4096

# Proxy
PROXY_HOST=0.0.0.0
PROXY_PORT_START=8000  # Ports dynamiques 8000-9000
SSL_CERT_DIR=/data/certs

# CORS
CORS_ORIGIN=http://localhost:5173,https://app.pentestai.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15min
RATE_LIMIT_MAX_REQUESTS=100

# Tokens AI (limites plans)
FREE_TOKENS_MONTHLY=10000
PRO_TOKENS_MONTHLY=100000
ENTERPRISE_TOKENS_MONTHLY=500000
```

### Docker Compose Local

```yaml
# docker-compose.yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pentestai
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://dev:devpass@postgres:5432/pentestai
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ./backend/src:/app/src
      - ./data/certs:/data/certs
      - ./data/logs:/data/logs
    ports:
      - "3000:3000"
      - "8000-8100:8000-8100"  # Ports proxy dynamiques
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_WS_URL: ws://localhost:3000
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "5173:5173"

volumes:
  postgres_data:
  redis_data:
```

### Docker Compose Production

```yaml
# docker-compose.prod.yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./data/certbot:/var/www/certbot
    depends_on:
      - backend
      - frontend

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_prod:/data
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: docker/Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./data/certs:/data/certs
      - ./data/logs:/data/logs
    restart: always
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: docker/Dockerfile.prod
    environment:
      VITE_API_URL: ${FRONTEND_API_URL}
      VITE_WS_URL: ${FRONTEND_WS_URL}
    restart: always

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    restart: always

volumes:
  postgres_prod:
  redis_prod:
  prometheus_data:
  grafana_data:
```

---

## 🔒 Sécurité & Compliance

### Mesures de Sécurité

1. **Authentification**
   - Bcrypt pour passwords (cost 12)
   - JWT avec rotation refresh tokens
   - Rate limiting auth endpoints
   - 2FA (future)

2. **Proxy MITM**
   - Certificats uniques par user
   - Isolation stricte des sessions
   - Pas de logs de données sensibles
   - Chiffrement at-rest des certificats

3. **Base de Données**
   - Prepared statements (Prisma)
   - Encryption at-rest
   - Backups chiffrés quotidiens
   - RBAC (Role-Based Access Control)

4. **API**
   - CORS strict
   - Rate limiting par IP + user
   - Input validation (Zod)
   - CSRF tokens
   - Security headers (Helmet.js)

5. **Infrastructure**
   - VPS hardening
   - Firewall (iptables/ufw)
   - Fail2ban
   - Automated security updates
   - SSL/TLS uniquement (A+ rating)

### RGPD & Privacy

- ✅ Pas de stockage données sensibles des requêtes
- ✅ Opt-in explicite historique
- ✅ Suppression compte = purge complète
- ✅ Export données utilisateur (JSON)
- ✅ Logs anonymisés
- ✅ CGU/Privacy Policy claires

---

## 📈 Métriques & Analytics

### Stack Monitoring

```yaml
Prometheus: Métriques système/app
  - Latency P50/P95/P99
  - Request rate
  - Error rate
  - WebSocket connections
  - AI API calls/tokens

Grafana: Dashboards visuels
  - Proxy performance
  - User activity
  - Business metrics
  - AI usage
  - Costs

Winston + Loki: Logs centralisés
  - Erreurs applicatives
  - Suspicious activity
  - Audit trail

Sentry: Error tracking
  - Frontend exceptions
  - Backend crashes
  - User feedback
```

---

## 🎓 Documentation & Support

### Documentation Utilisateur
- 📖 Getting Started (5min)
- 🎥 Vidéos tutoriels
- 📚 Guide pentest avec AI
- ❓ FAQ
- 🛠️ Troubleshooting

### Documentation Technique
- 🏗️ Architecture overview
- 🔌 API Reference
- 🧩 Plugin development (futur)
- 🔐 Security best practices

### Support
- 💬 Discord community
- 📧 Email support (PRO+)
- 🎫 Ticket system (ENTERPRISE)
- 📞 Call support (ENTERPRISE)

---

## ✅ Checklist Production

### Pré-Lancement
- [ ] Tests e2e complets
- [ ] Load testing (100+ users simultanés)
- [ ] Security audit
- [ ] Backup/restore testés
- [ ] Monitoring configuré
- [ ] Alertes critiques setup
- [ ] Documentation complète
- [ ] CGU/Privacy Policy
- [ ] Stripe webhooks testés
- [ ] DNS configuré
- [ ] SSL certificates valides

### Post-Lancement
- [ ] Monitoring 24/7 actif
- [ ] Support disponible
- [ ] Marketing campaign lancée
- [ ] Product Hunt scheduled
- [ ] Social media posts
- [ ] Email onboarding configuré
- [ ] Analytics tracking actif
- [ ] A/B testing pricing setup

---

## 🎯 Conclusion

**PentestAI Proxy** combine la puissance d'un proxy MITM professionnel avec l'intelligence de Claude pour révolutionner le pentesting. 

**Avantages compétitifs:**
- 🤖 Seul proxy avec AI assistant natif
- ⚡ Setup < 5 minutes
- 💰 Pricing accessible (vs Burp Pro $449)
- 🌐 Architecture cloud-native
- 📈 Business model scalable

**Next steps:**
1. Valider le GUIDE.md
2. Développement MVP (4 semaines)
3. Beta testing (2 semaines)
4. Production launch
5. Growth & scaling

Le marché du pentest est en croissance (20%/an), avec de plus en plus d'entreprises cherchant à sécuriser leurs applications. Un outil moderne, accessible et intelligent a toute sa place.

**Let's build this! 🚀**