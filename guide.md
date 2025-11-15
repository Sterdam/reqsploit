# PENTEST AI PROXY - Guide de Développement avec Claude Code

## 📋 Préambule

Ce guide contient **tous les prompts** nécessaires pour construire PentestAI Proxy avec Claude Code de manière **modulaire, incrémentale et robuste**.

### Principes de Développement
- ✅ **Modularité** : chaque composant est indépendant
- ✅ **Testabilité** : tests à chaque étape
- ✅ **Production-ready** : code de qualité dès le début
- ✅ **Docker-first** : tout tourne en containers
- ✅ **Incrémental** : features ajoutées progressivement

### Prérequis Système
```bash
# Installations nécessaires
- Docker & Docker Compose (v2.x)
- Node.js 20+ (pour développement local extension)
- Git
- Un éditeur (VSCode recommandé)
```

### Structure du Projet
```
pentestai-proxy/
├── backend/          # API + Proxy MITM + WebSocket
├── frontend/         # Dashboard React
├── extension/        # Chrome Extension
├── shared/           # Types partagés
├── monitoring/       # Prometheus + Grafana configs
├── nginx/            # Reverse proxy configs
├── data/             # Volumes persistants (dev)
│   ├── certs/
│   ├── logs/
│   └── postgres/
├── docker-compose.yaml      # Dev
├── docker-compose.prod.yaml # Production
└── README.md
```

---

## 🚀 PHASE 1 : SETUP & INFRASTRUCTURE

### Prompt 1.1 : Initialisation Projet & Structure

```
Je construis un SaaS de proxy MITM intelligent pour pentest avec assistance AI (Claude).

Architecture :
- Backend: Node.js + TypeScript + Express
- Frontend: React + TypeScript + Vite
- Extension: Chrome Extension Manifest V3
- Database: PostgreSQL + Prisma
- Cache: Redis
- WebSocket: socket.io
- AI: Anthropic Claude API

Crée la structure complète du projet avec :

1. **Structure racine** :
   - Dossiers backend/, frontend/, extension/, shared/
   - docker-compose.yaml (dev)
   - docker-compose.prod.yaml (production)
   - .gitignore global
   - README.md principal

2. **Backend** :
   - Structure modulaire complète (voir PLAN.md section "Structure des Composants")
   - package.json avec toutes les dépendances nécessaires :
     * express, typescript, prisma, socket.io
     * http-proxy, node-forge (certificats SSL)
     * @anthropic-ai/sdk
     * bcrypt, jsonwebtoken
     * zod (validation)
     * winston (logging)
   - tsconfig.json optimisé production
   - Dockerfile pour dev
   - Dockerfile.prod pour production
   - .env.example avec TOUTES les variables

3. **Frontend** :
   - Structure React moderne avec Vite
   - package.json avec :
     * react, typescript, vite
     * zustand, react-query
     * socket.io-client, axios
     * tailwindcss, shadcn/ui
     * monaco-editor
   - vite.config.ts
   - tsconfig.json
   - Dockerfile

4. **Extension** :
   - Structure Manifest V3
   - package.json avec webpack
   - manifest.json correct
   - webpack.config.js

5. **Shared** :
   - Types TypeScript communs
   - Constantes partagées
   - Utilitaires

6. **Docker Compose** :
   - Services : postgres, redis, backend, frontend
   - Volumes persistants
   - Network isolation
   - Variables d'environnement

**IMPORTANT** :
- Utilise les dernières versions stables
- Code TypeScript strict mode
- ESLint + Prettier configurés
- Prêt pour le développement immédiat

Génère TOUT le code et la structure maintenant.
```

### Prompt 1.2 : Base de Données & Prisma Schema

```
Configure Prisma avec PostgreSQL pour PentestAI Proxy.

Crée le schéma Prisma complet dans backend/prisma/schema.prisma avec les modèles :

1. **User**
   - id (UUID)
   - email (unique)
   - passwordHash
   - name
   - plan (enum: FREE, PRO, ENTERPRISE)
   - isActive
   - emailVerified
   - createdAt, updatedAt

2. **Session**
   - id (UUID)
   - userId (FK)
   - refreshToken (unique)
   - expiresAt
   - ipAddress
   - userAgent
   - createdAt

3. **ProxySession**
   - id (UUID)
   - userId (FK)
   - sessionId (unique)
   - proxyPort (Int)
   - isActive
   - interceptMode (Boolean)
   - createdAt, updatedAt

4. **Certificate**
   - id (UUID)
   - userId (FK)
   - certPem (Text)
   - keyPem (Text, encrypted)
   - type (enum: ROOT_CA, DOMAIN)
   - domain (nullable)
   - expiresAt
   - createdAt

5. **RequestLog**
   - id (UUID)
   - userId (FK)
   - proxySessionId (FK)
   - method
   - url
   - headers (Json)
   - body (Text, nullable)
   - statusCode (nullable)
   - responseHeaders (Json, nullable)
   - responseBody (Text, nullable)
   - duration (Int ms)
   - timestamp
   - isIntercepted (Boolean)

6. **AIAnalysis**
   - id (UUID)
   - requestLogId (FK)
   - analysisType (enum: QUICK, DEEP, EXPLOIT, EXPLAIN)
   - userContext (Text, nullable)
   - aiResponse (Text)
   - suggestions (Json)
   - tokensUsed (Int)
   - confidence (Int 0-100)
   - createdAt

7. **TokenUsage**
   - id (UUID)
   - userId (FK)
   - monthYear (String YYYY-MM, unique with userId)
   - tokensUsed (Int)
   - tokensLimit (Int)
   - resetDate
   - createdAt, updatedAt

8. **Subscription**
   - id (UUID)
   - userId (FK unique)
   - plan
   - stripeCustomerId
   - stripeSubscriptionId
   - status (enum: ACTIVE, CANCELED, PAST_DUE)
   - currentPeriodStart
   - currentPeriodEnd
   - createdAt, updatedAt

Inclus aussi :
- Relations appropriées
- Indexes pour performance
- Migrations initiales
- Seed script avec user de test

Génère :
1. schema.prisma complet
2. Script de migration
3. backend/prisma/seed.ts
4. Instructions pour init DB

Utilise les meilleures pratiques Prisma.
```

### Prompt 1.3 : Auth Service & JWT

```
Implémente le système d'authentification complet pour PentestAI Proxy.

Crée :

1. **backend/src/services/auth.service.ts**
   - register(email, password, name)
   - login(email, password) → { accessToken, refreshToken, user }
   - refresh(refreshToken) → { accessToken, refreshToken }
   - logout(refreshToken)
   - verifyAccessToken(token) → User
   - Validation email (unique, format)
   - Password hashing (bcrypt, cost 12)
   - JWT génération (access 15min, refresh 7d)
   - Rotation refresh tokens

2. **backend/src/services/user.service.ts**
   - getUserById(id)
   - updateUser(id, data)
   - deleteUser(id)
   - getUserPlan(id)
   - activateUser(id)

3. **backend/src/api/middlewares/auth.middleware.ts**
   - authenticateToken : vérifie JWT access token
   - requirePlan(['PRO', 'ENTERPRISE']) : vérifie plan user
   - Gestion erreurs 401/403

4. **backend/src/api/routes/auth.routes.ts**
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh
   - POST /auth/logout
   - GET /auth/me (authenticated)

5. **backend/src/utils/errors.ts**
   - Classes d'erreurs custom :
     * UnauthorizedError
     * ForbiddenError
     * ValidationError
     * NotFoundError
   - Error handler middleware global

6. **Types TypeScript**
   - backend/src/types/auth.types.ts
   - Interfaces : LoginDTO, RegisterDTO, AuthResponse, etc.

7. **Validation**
   - Utilise Zod pour validation schemas
   - Middleware de validation

8. **Tests**
   - Tests unitaires services (Jest)
   - Tests d'intégration routes

**IMPORTANT** :
- Sécurité maximale (bcrypt, JWT, rate limiting)
- Gestion erreurs propre
- Logs appropriés (Winston)
- Environnement variables pour secrets
- Code production-ready

Génère tout le code maintenant avec commentaires explicatifs.
```

---

## 🔌 PHASE 2 : PROXY MITM CORE

### Prompt 2.1 : Certificate Manager (SSL/TLS)

```
Implémente le système de gestion de certificats SSL pour le proxy MITM.

Crée :

1. **backend/src/core/proxy/certificate-manager.ts**

Classe CertificateManager avec :

**Méthodes principales** :
- generateRootCA(userId: string): Promise<Certificate>
  * Génère certificat racine unique par user
  * Utilise node-forge
  * Validité 10 ans
  * Stocke dans DB + filesystem (/data/certs)

- generateDomainCert(domain: string, rootCA: Certificate): Promise<Certificate>
  * Génère cert signé pour un domaine
  * Validité 365 jours
  * Cache en mémoire (LRU cache, 1000 max)
  * Stocke dans DB

- getRootCAForUser(userId: string): Promise<Certificate | null>
  * Récupère ou génère Root CA

- getDomainCert(domain: string, userId: string): Promise<Certificate>
  * Récupère depuis cache/DB ou génère

- exportRootCAForDownload(userId: string): Promise<Buffer>
  * Export format .crt pour installation OS

**Sécurité** :
- Chiffrement clés privées at-rest (AES-256)
- Isolation stricte par userId
- Logs audits

**Cache** :
- LRU cache en mémoire pour domaines
- TTL 24h
- Invalidation sur demande

2. **backend/src/api/routes/certificate.routes.ts**
   - GET /certificates/root/download (authenticated)
   - GET /certificates/status (check si root CA existe)
   - POST /certificates/regenerate (regénère root CA)

3. **Tests unitaires complets**

4. **Documentation**
   - Guide installation certificat (Windows/macOS/Linux)
   - Troubleshooting courant

**IMPORTANT** :
- Utilise node-forge pour génération
- Performance optimisée (cache)
- Gestion erreurs exhaustive
- Logging détaillé
- Code production-ready

Génère tout maintenant avec commentaires.
```

### Prompt 2.2 : MITM Proxy Server

```
Implémente le serveur proxy MITM principal avec interception HTTP/HTTPS.

Crée :

1. **backend/src/core/proxy/mitm-proxy.ts**

Classe MITMProxy avec :

**Initialisation** :
- constructor(userId: string, port: number, certificateManager: CertificateManager)
- start(): Promise<void>
- stop(): Promise<void>
- Port dynamique unique par user (8000-9000)

**Proxy HTTP/HTTPS** :
- Utilise http-proxy + node http/https servers
- Interception CONNECT pour HTTPS (tunnel)
- Déchiffrement HTTPS avec certificats dynamiques
- Support HTTP/1.1 et HTTP/2

**Interception** :
- onRequest(request: HTTPRequest): Promise<HTTPRequest | 'block'>
  * Hook avant envoi au serveur cible
  * Permet modification headers/body
  * Logging

- onResponse(response: HTTPResponse): Promise<HTTPResponse>
  * Hook après réception réponse
  * Permet modification avant envoi au client
  * Logging

**État** :
- interceptMode: boolean (activer/désactiver interception)
- filters: RequestFilters (filtrer par domaine, méthode, etc.)
- stats: ProxyStats (requêtes/s, bande passante, etc.)

**WebSocket Integration** :
- Émet events en temps réel :
  * 'request:intercepted'
  * 'response:received'
  * 'request:modified'
  * 'error'

2. **backend/src/core/proxy/interceptor.ts**

Classe Interceptor :
- processRequest(req, interceptMode, filters): Promise<InterceptionResult>
  * Décide si interception nécessaire
  * Applique filtres
  * Return: { shouldIntercept, modifiedRequest, action }

- applyModification(req, modification): HTTPRequest
  * Applique modifications user

3. **backend/src/core/proxy/request-modifier.ts**

Utilitaires :
- parseHTTPRequest(rawRequest): HTTPRequest
- serializeHTTPRequest(request): Buffer
- parseHTTPResponse(rawResponse): HTTPResponse
- serializeHTTPResponse(response): Buffer

4. **Types** :
- backend/src/types/proxy.types.ts
  * HTTPRequest, HTTPResponse
  * ProxyConfig, ProxyStats
  * InterceptionResult, RequestFilters

5. **Tests d'intégration**
   - Test proxy HTTP basique
   - Test proxy HTTPS avec certificats
   - Test interception et modification
   - Test filtres

**IMPORTANT** :
- Performance critique (streaming, pas de buffer complet)
- Gestion mémoire (pas de leaks)
- Error handling robuste
- Logs détaillés
- Support WebSockets (passthrough)
- Production-ready

Génère tout le code avec architecture robuste.
```

### Prompt 2.3 : Proxy Session Manager

```
Implémente le gestionnaire de sessions proxy multi-utilisateurs.

Crée :

1. **backend/src/core/proxy/session-manager.ts**

Classe ProxySessionManager (Singleton) avec :

**Gestion Sessions** :
- createSession(userId: string): Promise<ProxySession>
  * Alloue port dynamique unique
  * Crée instance MITMProxy
  * Stocke dans Map (userId → ProxySession)
  * Enregistre dans DB
  * Return: { sessionId, proxyPort, wsToken }

- getSession(userId: string): ProxySession | null
- destroySession(userId: string): Promise<void>
  * Stop proxy
  * Cleanup ressources
  * Update DB

- getAllActiveSessions(): ProxySession[]

**Allocation Ports** :
- Port range : 8000-9000
- Tracking ports utilisés
- Réutilisation ports libérés
- Vérification disponibilité

**État Session** :
- isActive
- lastActivityAt
- totalRequests
- interceptMode
- connectedClients (WebSocket)

**Auto-Cleanup** :
- Timeout inactivité (30min)
- Cleanup automatique
- Logs audit

2. **backend/src/api/routes/proxy.routes.ts**
   - POST /proxy/session/start (authenticated)
     → { sessionId, proxyPort, certificateStatus }
   - DELETE /proxy/session/stop (authenticated)
   - GET /proxy/session/status (authenticated)
   - PATCH /proxy/session/intercept (toggle intercept mode)
   - PATCH /proxy/session/filters (update filters)

3. **backend/src/services/session.service.ts**
   - startProxySession(userId)
   - stopProxySession(userId)
   - getSessionInfo(userId)
   - updateSessionSettings(userId, settings)

4. **Tests**
   - Multi-users simultanés
   - Allocation ports
   - Cleanup timeout
   - Race conditions

**IMPORTANT** :
- Thread-safe (Map avec locks si nécessaire)
- Pas de collisions de ports
- Cleanup automatique robuste
- Monitoring ressources
- Production-ready

Génère le code complet.
```

---

## 🌐 PHASE 3 : WEBSOCKET REAL-TIME

### Prompt 3.1 : WebSocket Server & Events

```
Implémente le serveur WebSocket pour communication temps réel.

Crée :

1. **backend/src/core/websocket/ws-server.ts**

Classe WebSocketServer avec :

**Initialisation** :
- setupSocketIO(httpServer): void
- Authentification JWT sur connexion
- Association userId ↔ socket

**Events Émis (Server → Client)** :
- 'proxy:request' : nouvelle requête interceptée
- 'proxy:response' : réponse reçue
- 'proxy:modified' : requête modifiée
- 'ai:suggestion' : suggestion AI
- 'ai:analysis:start' : début analyse
- 'ai:analysis:chunk' : streaming réponse AI
- 'ai:analysis:complete' : fin analyse
- 'session:updated' : état session changé
- 'error' : erreur

**Events Reçus (Client → Server)** :
- 'proxy:modify:request' : modifier une requête
- 'proxy:forward:request' : forward après modification
- 'proxy:block:request' : bloquer requête
- 'ai:analyze:request' : demander analyse AI
- 'session:toggle:intercept' : toggle mode interception
- 'session:update:filters' : update filtres

**Gestion Connexions** :
- Par userId (1 user = 1 connection active)
- Reconnexion automatique (client)
- Heartbeat (ping/pong)
- Déconnexion cleanup

**Broadcast** :
- À user spécifique
- À room (session proxy)

2. **backend/src/core/websocket/events.ts**

Types TypeScript pour tous les events :
```typescript
// Server → Client
interface ProxyRequestEvent {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: Date;
}

interface AISuggestionEvent {
  requestId: string;
  suggestion: AISuggestion;
}

// Client → Server
interface ModifyRequestEvent {
  requestId: string;
  modifications: {
    headers?: Record<string, string>;
    body?: string;
    url?: string;
  };
}

// ... tous les autres events
```

3. **backend/src/core/websocket/handlers.ts**

Handlers pour chaque event client :
- handleModifyRequest(socket, data)
- handleForwardRequest(socket, data)
- handleBlockRequest(socket, data)
- handleAIAnalyze(socket, data)
- etc.

**Validation** :
- Zod schemas pour chaque event
- Vérification permissions

4. **Intégration avec MITMProxy**
   - MITMProxy émet vers WebSocketServer
   - WebSocketServer forward vers client approprié

5. **Tests**
   - Connexion/déconnexion
   - Émission events
   - Reconnexion
   - Multiple clients

**IMPORTANT** :
- socket.io avec reconnexion auto
- Validation stricte events
- Rate limiting par socket
- Logs détaillés
- Error handling
- Production-ready

Génère tout le code maintenant.
```

---

## 🤖 PHASE 4 : INTÉGRATION AI (CLAUDE)

### Prompt 4.1 : Claude API Client

```
Implémente le client Anthropic Claude API avec gestion tokens.

Crée :

1. **backend/src/core/ai/claude-client.ts**

Classe ClaudeClient avec :

**Configuration** :
- API key depuis env
- Model: claude-sonnet-4-5-20250929
- Max tokens: configurable
- Stream support

**Méthodes** :
- analyze(prompt: string, streaming: boolean): Promise<AnalysisResult>
  * Appel API Anthropic
  * Gestion streaming si enabled
  * Comptage tokens
  * Error handling

- streamAnalysis(prompt: string, onChunk: (chunk) => void): Promise<void>
  * Streaming réponse AI
  * Emit chunks via callback

- estimateTokens(text: string): number
  * Estimation rapide tokens

**Rate Limiting** :
- Max requests/min par user
- Gestion 429 (retry avec backoff)

**Error Handling** :
- Network errors
- API errors
- Timeout
- Quota exceeded

2. **backend/src/core/ai/analyzers/request-analyzer.ts**

Classe RequestAnalyzer :
- analyzeRequest(request: HTTPRequest, context?: string): Promise<Analysis>
  * Analyse sécurité requête
  * Détection patterns suspects
  * Return : { findings, suggestions, confidence }

- detectVulnerability(request: HTTPRequest): Promise<Vulnerability[]>
  * SQLi, XSS, IDOR, CSRF, etc.
  * Pattern matching + AI

3. **backend/src/core/ai/analyzers/response-analyzer.ts**

Classe ResponseAnalyzer :
- analyzeResponse(request, response, context?): Promise<Analysis>
  * Information disclosure
  * Error messages
  * Security headers
  * Cookies

4. **backend/src/core/ai/analyzers/exploit-suggester.ts**

Classe ExploitSuggester :
- suggestExploits(vulnerability: Vulnerability, request): Promise<Suggestion[]>
  * Suggestions d'exploitation
  * Payload examples
  * Step-by-step guide

5. **backend/src/core/ai/prompts/system-prompts.ts**

Prompts système optimisés :
```typescript
export const SYSTEM_PROMPTS = {
  REQUEST_ANALYSIS: `Tu es un expert en sécurité web...`,
  VULNERABILITY_DETECTION: `...`,
  EXPLOIT_SUGGESTION: `...`,
  QUICK_SCAN: `...`,
  DEEP_SCAN: `...`,
};
```

6. **backend/src/core/ai/prompts/context-builder.ts**

Classe ContextBuilder :
- buildContext(request, response?, history?, userContext?): string
  * Construction contexte intelligent
  * Inclusion historique pertinent
  * Optimisation tokens

7. **backend/src/services/token.service.ts**

Gestion tokens AI :
- checkTokenBalance(userId): Promise<{ balance, limit }>
- consumeTokens(userId, amount): Promise<void>
- resetMonthlyTokens(): Promise<void> (cron)
- getUsageStats(userId): Promise<Stats>

8. **backend/src/api/routes/ai.routes.ts**
   - POST /ai/analyze (authenticated, token check)
   - GET /ai/tokens/balance (authenticated)
   - GET /ai/tokens/history (authenticated)

9. **Types** :
   - backend/src/types/ai.types.ts
   - Interfaces : Analysis, Vulnerability, Suggestion, etc.

**IMPORTANT** :
- Gestion tokens stricte
- Optimisation coûts (cache analyses similaires)
- Streaming pour UX
- Error handling robuste
- Production-ready

Génère tout le code avec best practices.
```

### Prompt 4.2 : AI Background Analysis & Auto-Suggestions

```
Implémente l'analyse automatique en arrière-plan avec suggestions proactives.

Crée :

1. **backend/src/core/ai/background-analyzer.ts**

Classe BackgroundAnalyzer (Singleton) avec :

**Configuration** :
- Enabled/disabled par user
- Types analyses (vuln, optimization, security)
- Throttling (max 1 analyse/5s par user)

**Process** :
- onRequestIntercepted(request, userId):
  * Check si user a auto-analysis enabled
  * Check token balance
  * Queue analysis (évite spam)
  * Execute analyse async
  * Emit résultats via WebSocket

- onResponseReceived(request, response, userId):
  * Analyse combinée request+response
  * Plus riche en détection

**Queue System** :
- Priority queue (par type et sévérité)
- Worker pool (max 5 analyses parallel)
- Timeout 30s par analyse

**Cache** :
- Cache analyses similaires (hash request)
- TTL 1h
- Économie tokens

2. **backend/src/core/ai/suggestion-engine.ts**

Classe SuggestionEngine :
- generateSuggestions(analysis: Analysis): Suggestion[]
  * Transform AI output en suggestions actionnables
  * Priorité par severity
  * Actions concrètes (modifier, repeat, etc.)

- rankSuggestions(suggestions): Suggestion[]
  * Ordre par pertinence

3. **Intégration avec Proxy** :
   - Hook dans MITMProxy après chaque requête
   - Appel BackgroundAnalyzer si auto-mode enabled
   - WebSocket emit suggestions quand prêtes

4. **User Settings** :
   - backend/src/api/routes/settings.routes.ts
   - PATCH /settings/ai (authenticated)
     ```json
     {
       "autoAnalysis": true,
       "analysisTypes": ["vulnerability", "security"],
       "analysisDepth": "quick" | "deep"
     }
     ```

5. **Tests**
   - Throttling
   - Queue system
   - Cache hit/miss
   - Token consumption

**IMPORTANT** :
- Performance (async, non-blocking)
- Gestion tokens économe
- Cache intelligent
- UX fluide (suggestions arrivent sans délai frontend)
- Production-ready

Génère le code complet.
```

---

## 🎨 PHASE 5 : FRONTEND DASHBOARD

### Prompt 5.1 : Frontend Setup & Architecture

```
Initialise l'application frontend React avec architecture moderne.

Crée :

1. **Structure complète** (déjà définie, mais détaille le code)

2. **frontend/src/App.tsx**
   - Router principal (react-router-dom v6)
   - Layout avec Navbar + Sidebar
   - Routes protégées (RequireAuth HOC)
   - Routes :
     * / → Dashboard
     * /proxy → Page proxy principale
     * /history → Historique
     * /settings → Paramètres
     * /tokens → Gestion tokens AI
     * /login, /register

3. **frontend/src/services/api.service.ts**
   - Axios instance configurée
   - Interceptors (JWT auto-attach, refresh token)
   - Error handling global
   - Type-safe requests

4. **frontend/src/services/ws.service.ts**
   - socket.io-client setup
   - Reconnexion automatique
   - Event listeners typed
   - État connexion

5. **frontend/src/stores/auth.store.ts** (Zustand)
   - State : user, accessToken, isAuthenticated
   - Actions : login, logout, register, refresh
   - Persist dans localStorage (tokens)

6. **frontend/src/stores/proxy.store.ts**
   - State : requests[], selectedRequest, interceptMode, filters
   - Actions : addRequest, selectRequest, toggleIntercept, updateFilters
   - WebSocket sync

7. **frontend/src/stores/ai.store.ts**
   - State : suggestions[], analyses[], isAnalyzing, tokenBalance
   - Actions : addSuggestion, clearSuggestions, updateBalance
   - WebSocket sync

8. **frontend/src/hooks/useWebSocket.ts**
   - Custom hook pour WebSocket
   - Auto-subscribe/unsubscribe events
   - Return : { isConnected, emit, on, off }

9. **frontend/src/hooks/useProxy.ts**
   - Custom hook pour proxy logic
   - Actions : startProxy, stopProxy, modifyRequest, etc.

10. **frontend/src/hooks/useAuth.ts**
    - Custom hook auth
    - Return : { user, login, logout, register, isLoading }

11. **Styling** :
    - Tailwind CSS configuré
    - shadcn/ui installé
    - Dark mode support
    - Theme customisé (couleurs pentest pro)

12. **Types** :
    - frontend/src/types/*.types.ts (copie depuis shared/)

**IMPORTANT** :
- Architecture scalable
- Type safety strict
- State management clair
- WebSocket intégré dès le début
- UX fluide
- Production-ready

Génère tout le code frontend de base maintenant.
```

### Prompt 5.2 : Composants Proxy (Core UI)

```
Implémente les composants principaux de l'interface proxy.

Crée :

1. **frontend/src/pages/Proxy.tsx**

Layout principal :
```tsx
<ProxyPage>
  <ProxyHeader />         // Status, actions rapides
  <div className="flex">
    <RequestList />       // Liste requests (40% largeur)
    <RequestDetails />    // Détails + editor (40%)
    <AIPanel />          // AI assistant (20%)
  </div>
</ProxyPage>
```

2. **frontend/src/components/proxy/RequestList.tsx**

Liste virtualisée (react-window) :
- Affiche toutes les requêtes interceptées
- Tri/filtrage (méthode, statut, domaine)
- Search bar
- Sélection requête (highlight)
- Badges : méthode, status code, AI badge si analyse
- Infinite scroll
- Performance optimisée (1000+ requests)

3. **frontend/src/components/proxy/RequestDetails.tsx**

Panneau détails :
- Tabs : Request | Response | Diff
- **Request Tab** :
  * Headers (table)
  * Body (Monaco Editor avec syntax highlighting)
  * Query params
  * Cookies
- **Response Tab** :
  * Status, headers
  * Body (Monaco, pretty JSON/HTML/XML)
  * Timing
- **Diff Tab** (si modifié) :
  * react-diff-viewer : original vs modified

Actions :
- [Modify] : passe en mode édition
- [Repeat] : renvoie requête
- [Copy] : copie curl/fetch
- [AI Analyze] : analyse avec Claude

4. **frontend/src/components/proxy/RequestEditor.tsx**

Éditeur modification :
- Monaco Editor pour headers + body
- Validation temps réel
- Preview modifications
- Boutons :
  * [Apply & Forward]
  * [Cancel]
  * [Save as Template]

5. **frontend/src/components/proxy/ResponseViewer.tsx**

Viewer réponse :
- Auto-detect content type
- Formatters : JSON (pretty), HTML (rendered), Image, Binary
- Syntax highlighting
- Copy response

6. **frontend/src/components/proxy/InterceptionToggle.tsx**

Toggle interception :
- Switch ON/OFF
- Badge : "X requests pending" si intercept ON
- Tooltip explicatif

7. **frontend/src/components/proxy/ProxyHeader.tsx**

Header avec :
- Status proxy (ON/OFF, port)
- Intercept toggle
- Filters button
- Clear all button
- Stats : X req/s, Y total

**Styling** :
- Design moderne, dark mode
- Monospace fonts pour code
- Couleurs sémantiques (GET=bleu, POST=vert, etc.)
- Hover states, animations subtiles
- Responsive (desktop focus)

**IMPORTANT** :
- Performance critique (virtualization)
- UX fluide (pas de lag)
- Keyboard shortcuts
- Accessibility
- Production-ready

Génère tous les composants avec code complet et styling Tailwind.
```

### Prompt 5.3 : Composants AI Panel

```
Implémente le panneau assistant AI avec suggestions et analyses.

Crée :

1. **frontend/src/components/ai/AIPanel.tsx**

Panneau latéral droit :

Layout :
```tsx
<AIPanel>
  <AIHeader />           // Titre, token badge
  <ContextInput />       // Input contexte custom
  <SuggestionsList />    // Liste suggestions
  <AnalysisStatus />     // Status analyse en cours
  <AISettings />         // Settings panel (collapsible)
</AIPanel>
```

2. **frontend/src/components/ai/SuggestionCard.tsx**

Carte suggestion :
- Severity badge (critical, high, medium, low, info)
- Icône par type (🚨 vuln, 💡 tip, ⚠️ warning)
- Titre
- Description (collapsible si long)
- Confidence bar (0-100%)
- Actions :
  * [Apply] : applique modification suggérée
  * [Learn More] : ouvre modal explicatif
  * [Dismiss]

Design :
- Border color selon severity
- Animations d'apparition
- Hover effects

3. **frontend/src/components/ai/ContextInput.tsx**

Input contexte custom :
- Textarea expandable
- Placeholder : "Add custom context for AI analysis..."
- Character count
- Button [Analyze with Context]
- Preset contexts (dropdown) :
  * "Focus on SQL injection"
  * "Check authentication bypass"
  * "Look for IDOR"
  * Custom presets sauvegardés

4. **frontend/src/components/ai/VulnerabilityAlert.tsx**

Alert vulnérabilité détectée :
- Style alerte (rouge pour critical)
- Titre vulnérabilité
- CVSS score si applicable
- Description courte
- Actions rapides :
  * [Exploit] : ouvre exploit suggester
  * [Report] : copie rapport
  * [Dismiss]

5. **frontend/src/components/ai/AISettings.tsx**

Settings collapsible :
- Toggle auto-analysis
- Checkboxes types analyses :
  * □ Vulnerability detection
  * □ Security optimization
  * □ Performance tips
- Analysis depth : Quick | Deep
- Token budget slider (pour auto)

6. **frontend/src/components/ai/AnalysisStatus.tsx**

Status bar analyse en cours :
- Loader animé
- "Analyzing request..."
- Progress si disponible
- Tokens used : X / balance
- [Cancel] button

7. **Streaming AI Response**

Component pour streaming :
- Affiche réponse AI chunk par chunk
- Markdown rendering (react-markdown)
- Smooth scroll auto
- Copy response button

**Intégration WebSocket** :
- Écoute events AI
- Update UI real-time
- Notifications toast

**IMPORTANT** :
- UX engageante (animations)
- Feedback immédiat
- Token awareness
- Accessibilité
- Production-ready

Génère tous les composants AI avec code complet.
```

### Prompt 5.4 : Pages Auth & Settings

```
Implémente les pages authentification et paramètres.

Crée :

1. **frontend/src/pages/Auth/Login.tsx**

Page login :
- Formulaire : email + password
- Validation temps réel (react-hook-form + zod)
- Button [Login]
- Link "Forgot password?"
- Link "Don't have account? Register"
- Error messages
- Loading state
- Redirect si déjà auth

2. **frontend/src/pages/Auth/Register.tsx**

Page register :
- Formulaire : name, email, password, confirm password
- Validation stricte
- Password strength indicator
- Button [Register]
- Link "Already have account? Login"
- CGU checkbox

3. **frontend/src/pages/Dashboard.tsx**

Dashboard overview :
- Cards :
  * Proxy status
  * Requests today
  * Vulnerabilities found
  * Token usage
- Quick actions :
  * [Start Proxy]
  * [View History]
  * [Download Certificate]
- Recent activity feed
- AI insights highlights

4. **frontend/src/pages/Settings.tsx**

Page settings avec tabs :

**Profile Tab** :
- Edit name, email
- Change password
- Delete account

**Proxy Tab** :
- Default filters
- Auto-start proxy
- Port preference
- Certificate management :
  * Download root CA
  * Regenerate
  * Installation guide button

**AI Tab** :
- Auto-analysis toggle
- Analysis types
- Analysis depth
- Custom prompts (Pro+)
- Token alerts

**Subscription Tab** :
- Current plan badge
- Usage stats : tokens, requests, storage
- [Upgrade] button
- Billing history (si Pro+)

**Security Tab** :
- Active sessions list
- 2FA (future)
- API keys (Enterprise)

5. **frontend/src/pages/Tokens.tsx**

Page gestion tokens :
- Current balance (big number)
- Usage graph (last 30 days)
- Plan limits indicator
- [Buy Tokens] button (modal)
- Usage breakdown :
  * Quick analyses : X tokens
  * Deep analyses : Y tokens
  * Auto background : Z tokens
- Top analyzed domains

**Modals** :
- BuyTokensModal (Stripe integration future)
- ConfirmActionModal (delete account, etc.)
- CertificateGuideModal (step-by-step OS)

**IMPORTANT** :
- Forms validation propre
- UX intuitive
- Responsive
- Accessibility
- Production-ready

Génère toutes les pages avec code complet.
```

---

## 🔌 PHASE 6 : CHROME EXTENSION

### Prompt 6.1 : Extension Chrome Manifest V3

```
Implémente l'extension Chrome complète avec configuration automatique du proxy.

Crée :

1. **extension/public/manifest.json**

Manifest V3 complet :
```json
{
  "manifest_version": 3,
  "name": "PentestAI Proxy",
  "version": "1.0.0",
  "description": "Intelligent MITM Proxy for Pentest with AI Assistant",
  "permissions": [
    "proxy",
    "storage",
    "tabs",
    "webRequest",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

2. **extension/src/background/service-worker.ts**

Service Worker (MV3) avec :

**Initialisation** :
- chrome.runtime.onInstalled : setup initial
- Vérification auth token dans storage
- Connexion API backend

**Proxy Management** :
- configureProxy(proxyHost, proxyPort):
  ```typescript
  chrome.proxy.settings.set({
    value: {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: proxyHost,
          port: proxyPort
        }
      }
    },
    scope: "regular"
  });
  ```

- clearProxy() : reset proxy settings

**State Management** :
- chrome.storage.local pour :
  * auth token
  * proxy config (host, port)
  * user preferences
  * isProxyActive

**Messages Handlers** :
- chrome.runtime.onMessage :
  * 'start-proxy' : configure proxy
  * 'stop-proxy' : clear proxy
  * 'get-status' : return current status
  * 'refresh-token' : refresh auth

**API Communication** :
- Fetch backend API
- Store session info
- Handle errors

3. **extension/src/background/proxy-manager.ts**

Classe ProxyManager :
- startProxy(userId, token): Promise<ProxyConfig>
  * Call backend API /proxy/session/start
  * Get { proxyPort, sessionId }
  * Configure Chrome proxy
  * Update badge icon

- stopProxy(): Promise<void>
- getStatus(): Promise<ProxyStatus>

4. **extension/src/background/auth-manager.ts**

Classe AuthManager :
- login(email, password): Promise<AuthResponse>
- logout(): Promise<void>
- refreshToken(): Promise<string>
- getStoredToken(): Promise<string | null>
- isAuthenticated(): Promise<boolean>

**IMPORTANT** :
- Manifest V3 strict
- Permissions minimales
- Error handling
- Persistent state
- Production-ready

Génère le code complet du service worker.
```

### Prompt 6.2 : Extension Popup UI

```
Implémente l'UI popup de l'extension Chrome.

Crée :

1. **extension/src/popup/Popup.tsx**

React app popup (Vite build) :

**Layout** :
```tsx
{!isAuthenticated ? (
  <LoginForm />
) : (
  <>
    <ProxyStatus />
    <QuickActions />
    <TokenBadge />
    <SettingsButton />
  </>
)}
```

2. **extension/src/popup/components/ProxyStatus.tsx**

Status display :
- Badge : 🟢 Active / 🔴 Inactive
- Info : Port, Requests count
- Button [Start Proxy] ou [Stop Proxy]
- Link "Open Dashboard" → ouvre frontend

3. **extension/src/popup/components/QuickActions.tsx**

Actions rapides :
- [Toggle Intercept]
- [Download Certificate]
- [View History]
- [Settings]

4. **extension/src/popup/components/TokenBadge.tsx**

Badge tokens :
- Display : "8,450 tokens"
- Progress bar (usage)
- Link "Manage Tokens"

5. **extension/src/popup/components/LoginForm.tsx**

Form login dans popup :
- Email + Password
- Button [Login]
- Link "Register on web"
- Error messages

6. **Styling** :
- Popup dimensions : 350x500px
- Tailwind CSS
- Cohérent avec frontend
- Dark mode

7. **Communication avec Service Worker** :
- chrome.runtime.sendMessage
- chrome.storage listeners

**Build** :
- Webpack/Vite config pour bundle popup
- Output : popup.html + popup.js

**IMPORTANT** :
- UX rapide (pas de lag)
- Feedback visuel
- Error handling
- Production-ready

Génère tout le code popup avec styling.
```

### Prompt 6.3 : Extension Build & Packaging

```
Configure le build et packaging de l'extension.

Crée :

1. **extension/webpack.config.js**

Configuration Webpack :
- Entry points :
  * background : service-worker.ts
  * popup : popup.tsx
  * (optionnel) content-script.ts

- Output :
  * dist/background.js
  * dist/popup.js
  * dist/popup.html

- Loaders :
  * TypeScript (ts-loader)
  * React (babel-loader)
  * CSS (style-loader, css-loader, postcss-loader pour Tailwind)

- Plugins :
  * HtmlWebpackPlugin pour popup.html
  * CopyWebpackPlugin pour manifest.json, icons

- Mode : production (minify)

2. **extension/package.json**

Scripts :
```json
{
  "scripts": {
    "dev": "webpack --mode development --watch",
    "build": "webpack --mode production",
    "package": "npm run build && node scripts/package.js"
  }
}
```

3. **extension/scripts/package.js**

Script packaging :
- Crée extension/dist/
- Copy manifest, icons, etc.
- Zip pour distribution : pentestai-proxy-v1.0.0.zip
- Logs : "Extension packaged: pentestai-proxy-v1.0.0.zip"

4. **extension/README.md**

Documentation :
- Installation depuis .zip (Dev mode)
- Installation Chrome Web Store (future)
- Configuration
- Troubleshooting

**IMPORTANT** :
- Build optimisé (minify, tree-shaking)
- Source maps pour debug
- Production-ready

Génère toutes les configs de build.
```

---

## 🐳 PHASE 7 : DOCKER & DÉPLOIEMENT

### Prompt 7.1 : Dockerfiles Production

```
Crée les Dockerfiles optimisés pour production.

1. **backend/docker/Dockerfile.prod**

Multi-stage build :

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

ENV NODE_ENV=production
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

2. **frontend/docker/Dockerfile.prod**

Multi-stage build :

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

# Stage 2: Nginx serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

3. **frontend/nginx.conf**

Config Nginx :
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /socket.io {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

**IMPORTANT** :
- Multi-stage (images légères)
- Non-root user
- Healthchecks
- Security best practices
- Production-ready

Génère tous les Dockerfiles production.
```

### Prompt 7.2 : Docker Compose Production

```
Crée le docker-compose.prod.yaml complet pour déploiement VPS.

**docker-compose.prod.yaml** :

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: pentestai-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot-webroot:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - pentestai-net

  certbot:
    image: certbot/certbot
    container_name: pentestai-certbot
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
      - certbot-webroot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

  postgres:
    image: postgres:16-alpine
    container_name: pentestai-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "-E UTF8 --locale=C"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - pentestai-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pentestai-redis
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - pentestai-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: docker/Dockerfile.prod
    container_name: pentestai-backend
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      ANTHROPIC_MODEL: claude-sonnet-4-5-20250929
      CORS_ORIGIN: https://${DOMAIN}
    volumes:
      - cert-data:/data/certs
      - log-data:/data/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - pentestai-net
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: docker/Dockerfile.prod
    container_name: pentestai-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - pentestai-net

  prometheus:
    image: prom/prometheus:latest
    container_name: pentestai-prometheus
    restart: always
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - pentestai-net

  grafana:
    image: grafana/grafana:latest
    container_name: pentestai-grafana
    restart: always
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_SERVER_ROOT_URL: https://${DOMAIN}/grafana
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "3001:3000"
    networks:
      - pentestai-net

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  cert-data:
    driver: local
  log-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  certbot-webroot:
    driver: local

networks:
  pentestai-net:
    driver: bridge
```

**IMPORTANT** :
- Tous services avec restart: always
- Healthchecks
- Volumes persistants
- Network isolation
- Production-ready

Génère le fichier complet.
```

### Prompt 7.3 : Nginx Production & SSL

```
Configure Nginx comme reverse proxy avec SSL pour production.

Crée :

1. **nginx/nginx.conf**

Configuration complète :

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
  worker_connections 1024;
  use epoll;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log main;

  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  client_max_body_size 50M;

  # Gzip
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
  limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

  # Redirect HTTP to HTTPS
  server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
      root /var/www/certbot;
    }

    location / {
      return 301 https://$server_name$request_uri;
    }
  }

  # HTTPS Server
  server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/${DOMAIN}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...';
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend (React SPA)
    location / {
      proxy_pass http://frontend:80;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
      limit_req zone=api_limit burst=20 nodelay;

      proxy_pass http://backend:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      # Timeouts
      proxy_connect_timeout 60s;
      proxy_send_timeout 60s;
      proxy_read_timeout 60s;
    }

    # Auth endpoints (stricter rate limit)
    location /api/auth {
      limit_req zone=auth_limit burst=5 nodelay;

      proxy_pass http://backend:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
      proxy_pass http://backend:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      
      # WebSocket timeouts
      proxy_connect_timeout 7d;
      proxy_send_timeout 7d;
      proxy_read_timeout 7d;
    }

    # Monitoring (protected)
    location /grafana {
      auth_basic "Monitoring";
      auth_basic_user_file /etc/nginx/.htpasswd;

      proxy_pass http://grafana:3000;
      proxy_set_header Host $host;
    }
  }
}
```

2. **Script SSL Setup** : `scripts/setup-ssl.sh`

```bash
#!/bin/bash
# Setup SSL avec Let's Encrypt

DOMAIN=${1:-your-domain.com}
EMAIL=${2:-admin@your-domain.com}

echo "Setting up SSL for $DOMAIN..."

# Initial certificate (certbot standalone)
docker-compose -f docker-compose.prod.yaml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

echo "SSL certificate obtained for $DOMAIN"
echo "Restarting Nginx..."
docker-compose -f docker-compose.prod.yaml restart nginx
```

**IMPORTANT** :
- SSL A+ rating
- Rate limiting
- Security headers
- WebSocket support
- Production-ready

Génère les configs complètes.
```

---

## 📊 PHASE 8 : MONITORING & LOGGING

### Prompt 8.1 : Prometheus & Grafana

```
Configure monitoring avec Prometheus et Grafana.

Crée :

1. **monitoring/prometheus.yml**

Configuration Prometheus :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
```

2. **backend/src/utils/metrics.ts**

Métriques custom :

```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();

// Métriques HTTP
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Métriques Proxy
export const proxyRequestsTotal = new promClient.Counter({
  name: 'proxy_requests_total',
  help: 'Total proxy requests',
  labelNames: ['method', 'domain'],
  registers: [register],
});

export const proxyActiveSessions = new promClient.Gauge({
  name: 'proxy_active_sessions',
  help: 'Number of active proxy sessions',
  registers: [register],
});

// Métriques AI
export const aiAnalysisTotal = new promClient.Counter({
  name: 'ai_analysis_total',
  help: 'Total AI analyses',
  labelNames: ['type', 'success'],
  registers: [register],
});

export const aiTokensUsed = new promClient.Counter({
  name: 'ai_tokens_used_total',
  help: 'Total AI tokens consumed',
  labelNames: ['user_plan'],
  registers: [register],
});

// Endpoint /metrics
export function getMetrics() {
  return register.metrics();
}
```

3. **backend/src/api/routes/metrics.routes.ts**

```typescript
router.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(getMetrics());
});
```

4. **monitoring/grafana/dashboards/main-dashboard.json**

Dashboard Grafana JSON :
- Panels :
  * Requests/s (Graph)
  * Active proxy sessions (Gauge)
  * AI analyses today (Stat)
  * Tokens consumed (Graph)
  * Error rate (Graph)
  * Response time P95 (Graph)
  * Top domains (Table)

5. **monitoring/grafana/datasources/prometheus.yaml**

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

**IMPORTANT** :
- Métriques business + techniques
- Dashboards actionables
- Alerts configurables
- Production-ready

Génère toutes les configs monitoring.
```

### Prompt 8.2 : Logging Centralisé

```
Configure logging centralisé avec Winston.

Crée :

1. **backend/src/utils/logger.ts**

Logger Winston :

```typescript
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pentestai-backend' },
  transports: [
    // Console (dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File (errors)
    new winston.transports.File({
      filename: '/data/logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // File (all)
    new winston.transports.File({
      filename: '/data/logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

// Separate loggers par contexte
export const proxyLogger = logger.child({ context: 'proxy' });
export const aiLogger = logger.child({ context: 'ai' });
export const authLogger = logger.child({ context: 'auth' });
```

2. **Middleware Logging** :

```typescript
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id,
    });
  });
  
  next();
}
```

3. **Log Sanitization** :

```typescript
// NEVER log sensitive data
function sanitize(obj: any): any {
  const sensitive = ['password', 'token', 'apiKey', 'secret'];
  // ... implementation
}
```

4. **Log Rotation** :

Script cron pour rotation :
```bash
# /etc/cron.daily/pentestai-log-rotation
#!/bin/bash
find /data/logs -name "*.log" -mtime +30 -delete
```

**IMPORTANT** :
- Structured logging (JSON)
- Pas de données sensibles
- Rotation automatique
- Levels appropriés
- Production-ready

Génère tous les loggers.
```

---

## 🚀 PHASE 9 : CI/CD & DÉPLOIEMENT

### Prompt 9.1 : GitHub Actions CI/CD

```
Configure pipeline CI/CD complet avec GitHub Actions.

Crée :

1. **.github/workflows/ci.yaml**

Pipeline CI (tests, lint, build) :

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Lint
        working-directory: backend
        run: npm run lint
      
      - name: Type check
        working-directory: backend
        run: npm run type-check
      
      - name: Run Prisma migrations
        working-directory: backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      
      - name: Run tests
        working-directory: backend
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Lint
        working-directory: frontend
        run: npm run lint
      
      - name: Type check
        working-directory: frontend
        run: npm run type-check
      
      - name: Run tests
        working-directory: frontend
        run: npm test
      
      - name: Build
        working-directory: frontend
        run: npm run build

  extension-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: extension
        run: npm ci
      
      - name: Build extension
        working-directory: extension
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: extension-build
          path: extension/dist
```

2. **.github/workflows/cd.yaml**

Pipeline CD (deploy production) :

```yaml
name: CD - Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/docker/Dockerfile.prod
          push: true
          tags: |
            pentestai/backend:latest
            pentestai/backend:${{ github.sha }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          file: ./frontend/docker/Dockerfile.prod
          push: true
          tags: |
            pentestai/frontend:latest
            pentestai/frontend:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/pentestai-proxy
            git pull origin main
            docker-compose -f docker-compose.prod.yaml pull
            docker-compose -f docker-compose.prod.yaml up -d
            docker system prune -af
      
      - name: Health check
        run: |
          sleep 10
          curl -f https://${{ secrets.DOMAIN }}/api/health || exit 1
```

**IMPORTANT** :
- Tests automatiques
- Build multi-arch
- Zero-downtime deploy
- Health checks
- Production-ready

Génère les workflows complets.
```

### Prompt 9.2 : Scripts de Déploiement

```
Crée les scripts de déploiement et maintenance.

1. **scripts/deploy.sh**

```bash
#!/bin/bash
set -e

echo "🚀 Deploying PentestAI Proxy..."

# Variables
ENVIRONMENT=${1:-production}
DOMAIN=${DOMAIN:-pentestai.com}

# Pull latest code
git pull origin main

# Load env vars
export $(cat .env.$ENVIRONMENT | xargs)

# Backup database
echo "📦 Backing up database..."
docker-compose -f docker-compose.prod.yaml exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backups/db-$(date +%Y%m%d-%H%M%S).sql

# Pull latest images
echo "🐳 Pulling latest images..."
docker-compose -f docker-compose.prod.yaml pull

# Run migrations
echo "🔄 Running migrations..."
docker-compose -f docker-compose.prod.yaml run --rm backend \
  npx prisma migrate deploy

# Restart services (zero-downtime)
echo "♻️ Restarting services..."
docker-compose -f docker-compose.prod.yaml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yaml up -d --no-deps --build frontend

# Health check
echo "🏥 Health check..."
sleep 5
curl -f https://$DOMAIN/api/health || { echo "❌ Health check failed"; exit 1; }

# Cleanup
echo "🧹 Cleanup..."
docker system prune -af --volumes

echo "✅ Deployment successful!"
```

2. **scripts/backup.sh**

```bash
#!/bin/bash
# Backup automatique (cron daily)

BACKUP_DIR=/opt/pentestai-proxy/backups
DATE=$(date +%Y%m%d-%H%M%S)

# Database backup
docker-compose -f docker-compose.prod.yaml exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Certificates backup
tar -czf $BACKUP_DIR/certs-$DATE.tar.gz data/certs/

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Upload to S3 (optionnel)
# aws s3 sync $BACKUP_DIR s3://pentestai-backups/
```

3. **scripts/restore.sh**

```bash
#!/bin/bash
# Restore from backup

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file>"
  exit 1
fi

echo "⚠️ Restoring from $BACKUP_FILE..."
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

# Stop services
docker-compose -f docker-compose.prod.yaml stop backend

# Restore database
gunzip < $BACKUP_FILE | docker-compose -f docker-compose.prod.yaml exec -T postgres \
  psql -U $POSTGRES_USER $POSTGRES_DB

# Restart
docker-compose -f docker-compose.prod.yaml start backend

echo "✅ Restore complete"
```

4. **scripts/health-check.sh**

```bash
#!/bin/bash
# Health check monitoring (cron every 5min)

URL="https://pentestai.com/api/health"
WEBHOOK=${SLACK_WEBHOOK_URL}

if ! curl -f -s $URL > /dev/null; then
  echo "❌ Health check failed for $URL"
  
  # Notify Slack
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 PentestAI Proxy is DOWN!"}' \
    $WEBHOOK
  
  # Try restart
  cd /opt/pentestai-proxy
  docker-compose -f docker-compose.prod.yaml restart backend
fi
```

**IMPORTANT** :
- Backups automatiques
- Zero-downtime deploy
- Health monitoring
- Error handling
- Production-ready

Génère tous les scripts.
```

---

## 📚 PHASE 10 : DOCUMENTATION

### Prompt 10.1 : Documentation Complète

```
Crée la documentation complète du projet.

1. **README.md** (racine)

README principal avec :
- Présentation projet
- Features principales
- Architecture overview (schéma)
- Prérequis
- Quick start (docker-compose up)
- Links vers docs détaillées
- Contributing guidelines
- License

2. **docs/INSTALLATION.md**

Guide installation détaillé :
- Prérequis système
- Setup dev local (étape par étape)
- Setup production VPS
- Configuration certificats SSL
- Troubleshooting courant

3. **docs/USER_GUIDE.md**

Guide utilisateur :
- Onboarding (screenshots)
- Utilisation proxy
- Interception requêtes
- Utilisation AI assistant
- Gestion tokens
- Best practices pentest

4. **docs/API.md**

Documentation API REST :
- Endpoints complets
- Exemples requests/responses
- Authentification
- Rate limiting
- Error codes

5. **docs/ARCHITECTURE.md**

Documentation architecture :
- Diagrammes détaillés
- Choix techniques justifiés
- Flow de données
- Sécurité
- Scalabilité

6. **docs/DEVELOPMENT.md**

Guide développeurs :
- Setup environnement
- Structure code
- Conventions naming
- Testing strategy
- Debugging tips
- Contributing

7. **docs/DEPLOYMENT.md**

Guide déploiement :
- VPS requirements
- Setup production
- CI/CD
- Monitoring
- Backup/restore
- Scaling

8. **CHANGELOG.md**

Historique versions :
- Format Keep a Changelog
- Semantic versioning

**Format** :
- Markdown propre
- Screenshots/GIFs
- Code examples
- Mermaid diagrams

Génère toute la documentation.
```

---

## ✅ CHECKLIST FINALE

### Prompt Final : Validation Complète

```
Valide que TOUT le projet est production-ready.

Exécute cette checklist complète :

## 🔒 Sécurité
- [ ] Secrets dans .env (pas de hardcode)
- [ ] JWT secure (secrets, expiration)
- [ ] HTTPS obligatoire (prod)
- [ ] Rate limiting actif
- [ ] Input validation (Zod)
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (sanitization)
- [ ] CORS configuré
- [ ] Security headers (Helmet)
- [ ] Certificats SSL validés

## 🏗️ Backend
- [ ] TypeScript strict mode
- [ ] ESLint + Prettier
- [ ] Tests unitaires > 80%
- [ ] Tests intégration
- [ ] Error handling global
- [ ] Logging structuré
- [ ] Prisma migrations
- [ ] Health endpoint
- [ ] Metrics endpoint
- [ ] WebSocket stable

## 🎨 Frontend
- [ ] TypeScript strict
- [ ] React best practices
- [ ] State management (Zustand)
- [ ] WebSocket reconnexion
- [ ] Loading states
- [ ] Error boundaries
- [ ] Responsive design
- [ ] Accessibility (A11y)
- [ ] Performance optimisée
- [ ] Build optimisé

## 🔌 Extension
- [ ] Manifest V3 valide
- [ ] Permissions minimales
- [ ] Proxy config auto
- [ ] Error handling
- [ ] Build packaging
- [ ] Cross-platform (Win/Mac/Linux)

## 🐳 Infrastructure
- [ ] Docker Compose dev
- [ ] Docker Compose prod
- [ ] Multi-stage builds
- [ ] Healthchecks
- [ ] Volumes persistants
- [ ] Network isolation
- [ ] Resource limits
- [ ] Nginx optimisé
- [ ] SSL Let's Encrypt
- [ ] Prometheus + Grafana

## 📊 Monitoring
- [ ] Métriques backend
- [ ] Métriques business
- [ ] Dashboards Grafana
- [ ] Alerts configurées
- [ ] Logs centralisés
- [ ] Error tracking (Sentry)

## 🚀 CI/CD
- [ ] Tests automatiques
- [ ] Build automatique
- [ ] Deploy automatique
- [ ] Zero-downtime
- [ ] Rollback strategy
- [ ] Health checks post-deploy

## 📚 Documentation
- [ ] README complet
- [ ] Guide installation
- [ ] Guide utilisateur
- [ ] API documentation
- [ ] Architecture docs
- [ ] CHANGELOG

## 🧪 Testing
- [ ] Tester signup/login
- [ ] Tester proxy MITM
- [ ] Tester interception
- [ ] Tester AI analysis
- [ ] Tester WebSocket
- [ ] Tester certificats
- [ ] Load testing (100+ users)
- [ ] Security audit

## 📋 Business
- [ ] Plans pricing définis
- [ ] Stripe intégration (future)
- [ ] Token management
- [ ] Usage tracking
- [ ] Email templates
- [ ] CGU/Privacy Policy

Génère un rapport final de validation avec status pour chaque item.
Si un item n'est pas OK, fournis le code/fix nécessaire.
```

---

## 🎯 RÉSUMÉ ORDRE D'EXÉCUTION

**Pour Claude Code, exécute les prompts dans cet ordre :**

```
Phase 1: Infrastructure (1.1 → 1.2 → 1.3)
Phase 2: Proxy Core (2.1 → 2.2 → 2.3)
Phase 3: WebSocket (3.1)
Phase 4: AI Integration (4.1 → 4.2)
Phase 5: Frontend (5.1 → 5.2 → 5.3 → 5.4)
Phase 6: Extension (6.1 → 6.2 → 6.3)
Phase 7: Docker Prod (7.1 → 7.2 → 7.3)
Phase 8: Monitoring (8.1 → 8.2)
Phase 9: CI/CD (9.1 → 9.2)
Phase 10: Documentation (10.1)
Validation: Prompt Final
```

**Commandes à exécuter après chaque phase :**

```bash
# Après Phase 1
docker-compose up -d postgres redis
cd backend && npx prisma migrate dev && npm run dev

# Après Phase 2
# Tester proxy standalone

# Après Phase 3
# Tester WebSocket connexion

# Après Phase 4
# Tester AI analysis avec ANTHROPIC_API_KEY

# Après Phase 5
cd frontend && npm run dev
# Tester full stack local

# Après Phase 6
cd extension && npm run build
# Installer extension Chrome dev mode

# Après Phase 7
docker-compose -f docker-compose.prod.yaml up -d
# Tester production local

# Après Phase 9
git push origin main
# Watch GitHub Actions

# Après Phase 10
# Review documentation complète
```

---

## 🎓 NOTES IMPORTANTES

### Pour Claude Code :
- **Copie-colle chaque prompt UN PAR UN**
- **Attends la complétion avant le suivant**
- **Teste après chaque phase majeure**
- **Vérifie les builds Docker**
- **Regarde les logs en continu**

### Secrets à configurer :
```bash
# .env.production (NE PAS COMMIT)
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
POSTGRES_PASSWORD=xxx
DOMAIN=pentestai.com
```

### VPS Requirements :
- **CPU**: 4 cores minimum
- **RAM**: 8GB minimum
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Docker**: 24.x
- **Swap**: 4GB

---

## ✨ TU ES PRÊT !

Ce guide contient **TOUT** pour construire PentestAI Proxy de A à Z.

Chaque prompt est **self-contained** et **production-ready**.

**Next step** : Commence par le Prompt 1.1 et avance pas à pas.

**Bonne chance ! 🚀**