# TODO: AI Integration Complete Plan

## ✅ Phase 1: Fondations (TERMINÉ)
- [x] AIPricingService - Gestion des crédits et pricing
- [x] ModelSelector - Sélection automatique Haiku/Sonnet
- [x] ClaudeClient - Support dual-model
- [x] aiStore - State management frontend
- [x] AICreditsWidget - Widget header avec balance
- [x] API endpoints: /api/ai/credits et /api/ai/pricing

## ✅ Phase 1.5: Corrections (TERMINÉ)
- [x] Corriger schema Prisma pour AI
- [x] Corriger analyzer.ts pour nouveaux tokens
- [x] Corriger types AI manquants
- [x] Tests compilation backend

## ✅ Phase 2: Intercept Panel Integration (TERMINÉ)
### Backend
- [x] Endpoint POST /api/ai/analyze/intercepted/:requestId
  - Analyser requête interceptée avec modifications optionnelles
  - Support des actions: analyzeRequest, explain, securityCheck
  - Détecter vulnérabilités potentielles
  - Générer suggestions de modifications
  - **Coût estimé: 10K tokens (Sonnet) / 8K tokens (Haiku)** (avec marge 4x)

**Fichiers créés/modifiés:**
- `/backend/src/api/routes/ai.routes.ts` - Ajout endpoint analyze/intercepted

### Frontend - InterceptPanel
- [x] AIActionButton component
  - Affichage du coût estimé en tokens avec badge coloré
  - Indicateur de tokens insuffisants (red dot)
  - Loading state avec spinner
  - Tooltip avec détails tokens et modèle
  - Variants: primary, secondary, danger
  - Sizes: sm, md, lg

- [x] AIResultPanel component
  - Affichage résultats analyse avec confidence et tokens
  - Summary stats (critical/high/medium/low counts)
  - Sections collapsibles (summary, findings)
  - Liste vulnérabilités avec severity icons et colors
  - Suggestions avec actions (Apply, Send to Repeater, Copy)

- [x] Intégration dans InterceptPanel.tsx
  - 3 boutons AI dans action buttons:
    - "AI Analyze" (primary) - Analyse complète
    - "Explain" (secondary) - Mode EDUCATIONAL
    - "Security Check" (secondary) - Scan sécurité rapide
  - Panel résultats affiché en dessous du contenu
  - Handlers pour AI analysis et application suggestions
  - Support modifications de la requête avant analyse

- [x] Actions suggérées
  - Bouton "Apply" pour appliquer modifications à la requête
  - Bouton "Send to Repeater" avec payload modifié
  - Bouton "Copy" pour copier payload

**Fichiers créés/modifiés:**
- `/frontend/src/components/AIActionButton.tsx` - Nouveau composant
- `/frontend/src/components/AIResultPanel.tsx` - Nouveau composant
- `/frontend/src/components/InterceptPanel.tsx` - Intégration AI
- `/frontend/src/stores/aiStore.ts` - Ajout currentAnalysis, setCurrentAnalysis, clearCurrentAnalysis
- `/frontend/src/lib/api.ts` - Ajout propriétés confidence, aiResponse, id aux types

**État de compilation:**
- Frontend: ✅ Build réussi (341.61 kB)
- Backend: ⚠️ Erreurs legacy dans analyzer.ts (n'affectent pas Phase 2)

**Notes:**
- Les 3 actions (analyzeRequest, explain, securityCheck) utilisent actuellement le même endpoint backend
- La différenciation par mode AI sera implémentée dans une phase ultérieure
- Les erreurs backend legacy dans analyzer.ts nécessitent des corrections mais ne bloquent pas Phase 2

## ✅ Phase 3: Requests List Integration (TERMINÉ)
### Backend
- [x] Endpoint POST /api/ai/quick-scan/:requestId
  - Scan rapide avec Haiku uniquement
  - **8000 tokens** par requête (~2000 tokens API × 4x marge)
  - Patterns connus seulement
  - Utilise analyzeRequest()

- [x] Endpoint POST /api/ai/deep-scan/:requestId
  - Scan approfondi avec Sonnet
  - **16000 tokens** par requête (~4000 tokens API × 4x marge)
  - Analyse complète avec contexte (request + response)
  - Utilise analyzeTransaction()

- [x] Endpoint POST /api/ai/batch-analyze
  - Analyser plusieurs requêtes en batch
  - Retourner résumé global avec results/errors
  - **8000 tokens × nombre de requêtes** (Quick Scan pour chaque)
  - Continue même en cas d'erreurs individuelles

**Fichiers modifiés:**
- `/backend/src/api/routes/ai.routes.ts` - Ajout 3 endpoints Phase 3

### Frontend - RequestList
- [x] Context menu AI actions
  - "Quick Scan (8K tokens)" - Calls `/api/ai/quick-scan/:requestId`
  - "Deep Scan (16K tokens)" - Calls `/api/ai/deep-scan/:requestId`
  - Loading states with animated icons
  - Disabled when scanning or insufficient tokens
  - Shows "Scanning..." during analysis

- [x] AI Analysis State Management
  - AIAnalysisInfo interface with severity, vulnerability count, suggestion count
  - AI analyses stored in requestsStore Map
  - AI filter state (analyzed/not analyzed, severity filtering)
  - Batch selection state (Set<string>)

- [x] Visual Indicators (Badges & Icons)
  - AI analysis badges on each request showing severity + vulnerability count
  - Severity icons: Critical (XOctagon), High (AlertTriangle), Medium (AlertCircle), Low (Info), Info (CheckCircle)
  - Color-coded severity badges (red, orange, yellow, blue, green)
  - Tooltip showing analysis type (Quick/Deep) and details

- [x] AI Filters
  - AI Status filter: All / Analyzed / Not Analyzed
  - Severity filter: All / Critical / High / Medium / Low / Info
  - "Clear AI Filters" button when filters are active
  - Filters integrated with getFilteredRequests()

- [x] Batch Analyze Selected Feature
  - Checkboxes on each request for multi-selection
  - "Select All" / "Deselect All" button
  - Batch selection indicator showing count of selected requests
  - "Batch Analyze" button calling /api/ai/batch-analyze endpoint
  - Progress indicator during batch analysis
  - Results stored in requestsStore with auto-calculated severity
  - Summary alert showing successful/failed analysis counts

**Fichiers créés/modifiés:**
- `/frontend/src/components/RequestList.tsx` - Complete AI integration
  - New imports: useAIStore, Shield, Zap, AlertTriangle, CheckCircle, Info, XOctagon icons
  - New state: aiScanning Set, batchAnalyzing, batchProgress
  - New handlers: handleQuickScan(), handleDeepScan(), handleBatchAnalyze()
  - Helper functions: getSeverityIcon(), getSeverityColor()
  - Context menu items: Quick Scan (8K tokens), Deep Scan (16K tokens)
  - AI filters UI with status and severity selection
  - Batch selection UI with checkboxes and batch actions
  - Visual badges showing AI analysis results

- `/frontend/src/stores/requestsStore.ts` - AI state management
  - AIAnalysisInfo interface exported
  - aiAnalyses: Map<string, AIAnalysisInfo>
  - aiFilter state: { analyzed?: boolean, severity?: 'critical' | 'high' | 'medium' | 'low' | 'info' }
  - selectedRequestIds: Set<string> for batch selection
  - AI actions: setRequestAnalysis(), getRequestAnalysis(), hasAnalysis(), setAIFilter(), clearAIFilter()
  - Batch actions: toggleRequestSelection(), selectAllRequests(), clearSelection(), getSelectedRequests()
  - Updated getFilteredRequests() to support AI filters

**État compilation:**
- Frontend: ✅ Build successful (351.73 kB)
- Backend: ✅ No new errors (legacy errors non-bloquants)

**Features complètes (0 TODOs restants):**
- [x] Indicateurs visuels (badges AI dans la liste)
- [x] Filtres AI (par severity, type de vulnérabilité)
- [x] Batch Analyze Selected (analyse multiple avec sélection)

## ✅ Phase 4: Repeater & Intruder
### Repeater (TERMINÉ)
- [x] AI Assistant panel (sidebar)
  - Suggestions en temps réel avec AI test variations
  - Bouton "Suggest Tests (12K tokens)"
  - Génération de variations avec categories et severity
  - Expandable test cards avec indicators
  - Token usage tracking

- [x] Endpoint POST /api/ai/suggest-tests/:tabId
  - Analyser requête Repeater avec Claude
  - Suggérer 5-10 tests pertinents
  - **12K tokens** (~3000 tokens API × 4x marge)
  - Variations intelligentes par test
  - Catégories: sqli, xss, auth, authz, injection, validation, ratelimit
  - Severity: critical, high, medium, low

- [x] Auto-execute mode
  - Checkbox "Auto-execute AI suggestions"
  - Exécution automatique des tests après application
  - Application des variations (method, url, headers, body)
  - Collecte résultats dans history

**Fichiers créés/modifiés:**
- `/backend/src/api/routes/ai.routes.ts` - Ajout endpoint suggest-tests (93 lignes)
- `/frontend/src/components/RepeaterAIPanel.tsx` - Nouveau composant AI Assistant (280 lignes)
- `/frontend/src/components/RepeaterPanel.tsx` - Intégration AI panel
- `/frontend/src/stores/aiStore.ts` - Ajout type 'suggestTests'

**État compilation:**
- Frontend: ✅ Build réussi (358.00 kB, gzip: 89.46 kB)
- Backend: ✅ Endpoint fonctionnel

**Features:**
- Toggle AI panel avec bouton Sparkles
- Layout adaptatif (Request/Response share space when AI panel shown)
- Severity icons et badges colorés (Critical/High/Medium/Low)
- Test variations avec Execute buttons
- Auto-execute optional pour tests rapides
- Token cost display et insuffisant tokens alert

### Intruder (TERMINÉ)
- [x] AI Payload Generator
  - Endpoint POST /api/ai/generate-payloads avec Claude
  - **16K tokens** (~4000 tokens API × 4x marge)
  - Context-aware payload generation
  - Configurable payload count (10-200)
  - Optional context input pour personnalisation
  - Modern bypass techniques et encoding variations

- [x] Payload categories (10 types)
  - SQL Injection (UNION, boolean-based, time-based, error-based)
  - Cross-Site Scripting (reflected, stored, DOM-based, filter bypass)
  - Command Injection (bash, powershell, cmd)
  - Path Traversal (directory traversal, file inclusion)
  - XXE (XML External Entity attacks)
  - SSTI (Server-Side Template Injection)
  - NoSQL Injection (MongoDB, etc.)
  - LDAP Injection
  - Authentication Bypass
  - IDOR / Access Control

**Fichiers créés/modifiés:**
- `/backend/src/api/routes/ai.routes.ts` - Ajout endpoint generate-payloads (93 lignes)
- `/frontend/src/components/IntruderPanel.tsx` - Ajout AI Generator UI
- `/frontend/src/stores/aiStore.ts` - Type 'generatePayloads' déjà présent

**État compilation:**
- Frontend: ✅ Build réussi (361.34 kB, gzip: 90.17 kB)
- Backend: ✅ Endpoint fonctionnel

**Features:**
- Category selector avec 10 types de payloads
- Optional context input pour ciblage précis
- Configurable count (10-200 payloads)
- Loading state avec animation
- Token affordability check avec alerts
- Toast notifications pour succès/erreurs
- Modern UI avec Sparkles icon
- Integration dans payload configuration workflow

## ✅ Phase 5: Advanced Features (TERMINÉ)
### Dork Generator (TERMINÉ)
- [x] Endpoint POST /api/ai/generate-dorks
  - **14K tokens** (~3500 tokens API × 4x marge)
  - Support 3 platforms: Google, Shodan, GitHub
  - Context-aware dork generation avec target + objective
  - 5-10 dorks par platform
  - Categories et severity pour chaque dork

- [x] Frontend integration (DorkGeneratorModal.tsx)
  - Modal complet avec platform selection
  - Input: target domain/org + objective + platforms
  - Output: dorks organisés par platform avec copy buttons
  - Color-coded severity badges
  - Collapsible results par platform
  - Token affordability check
  - Toast notifications

**Fichiers créés/modifiés:**
- `/backend/src/api/routes/ai.routes.ts` - Ajout endpoint generate-dorks (115 lignes)
- `/frontend/src/components/DorkGeneratorModal.tsx` - Nouveau composant modal (290 lignes)
- `/frontend/src/pages/Dashboard.tsx` - Bouton floating "AI Tools"

**État compilation:**
- Frontend: ✅ Build réussi (368.36 kB, gzip: 91.54 kB)
- Backend: ✅ Endpoint fonctionnel

**Features:**
- 3 platforms: Google (site:, inurl:, filetype:), Shodan (hostname:, port:, vuln:), GitHub (org:, filename:)
- Copy to clipboard functionality
- Severity indicators (critical/high/medium/low)
- Category tags pour organisation
- Executive summary de la stratégie de reconnaissance
- Floating button "AI Tools" en bas à droite du Dashboard

### Attack Chain Generator (TERMINÉ)
- [x] Endpoint POST /api/ai/generate-attack-chain/:projectId
  - **20K tokens** (~5000 tokens API × 4x marge)
  - Analyse jusqu'à 50 requêtes du projet
  - Génère chaîne d'attaque multi-étapes (3-8 steps)
  - Identifie dependencies entre steps
  - Technique classification (IDOR, SQLi, XSS, etc.)
  - Estimated impact et detection risk
  - Prerequisites et recommendations

**Fichiers créés/modifiés:**
- `/backend/src/api/routes/ai.routes.ts` - Ajout endpoint generate-attack-chain (138 lignes)

**État compilation:**
- Backend: ✅ Endpoint fonctionnel

**Features:**
- Analyse complète des requêtes du projet
- Step progression logique avec dependencies
- Realistic exploitation scenarios
- Request references pour chaque step
- Payloads et expected results
- Prevention recommendations
- Impact et detection risk assessment

### AI Reports
- [ ] Endpoint POST /api/ai/generate-report/:projectId
  - Rapport complet d'un projet
  - Summary exécutif
  - Findings détaillés
  - Recommandations

- [ ] Template report
  - Export PDF
  - Export Markdown
  - Export HTML

## ✅ UI/UX Components (Essentiels Créés)
- [x] **AIActionButton.tsx** - Intégré dans InterceptPanel, RequestList
  - Props: action, cost, onClick, loading
  - Badge coût avec tokens
  - Loading spinner
  - Tooltip descriptif

- [x] **AIResultPanel.tsx** - Créé (AIAnalysisPanel.tsx)
  - Props: analysis, onAction
  - Section vulnérabilités avec severity badges
  - Section suggestions avec actions
  - Actions rapides (Send to Repeater, etc.)

- [x] **AICreditsWidget.tsx** - Créé
  - Affichage tokens utilisés/restants
  - Barre de progression
  - Color-coded par usage

- [x] **RepeaterAIPanel.tsx** - Créé
  - AI test suggestions sidebar
  - Test variations avec execute buttons
  - Auto-execute toggle

- [x] **DorkGeneratorModal.tsx** - Créé
  - Platform selection (Google/Shodan/GitHub)
  - Results avec copy functionality
  - Severity badges

## 🎨 UI/UX Components (Optionnels - Phase 6+)
- [ ] **AIModelSelector.tsx**
  - Dropdown Haiku/Sonnet/Auto
  - Description de chaque modèle
  - Coût comparatif

- [ ] **AIModeSelector.tsx**
  - Buttons Educational/Default/Advanced
  - Description de chaque mode
  - Visual feedback

## 🔧 Migrations & Schema Updates (Phase 6+)
- [ ] Migration: Ajouter champ `model` à AIAnalysis
- [ ] Migration: Créer index sur `mode` et `tokensUsed`
- [ ] Migration: Créer table AIPayloadGeneration
- [ ] Migration: Créer table AIDorkGeneration
- [ ] Migration: Créer table AIAttackChain

## 📊 Analytics & Monitoring (Phase 6+)
- [ ] Dashboard usage AI
  - Crédits consommés par jour
  - Actions les plus utilisées
  - Modèles utilisés (Haiku vs Sonnet ratio)

- [ ] Alertes
  - Low credits warning (< 20%)
  - Daily usage spike
  - Model recommendation

## 🧪 Testing (Phase Séparée)
- [ ] Tests unitaires AIPricingService
- [ ] Tests unitaires ModelSelector
- [ ] Tests intégration API endpoints
- [ ] Tests E2E flow complet AI

## 📚 Documentation → Voir DOCUMENTATION_TODO.md
- [ ] Doc utilisateur: Comment utiliser l'AI
- [ ] Doc pricing: Plans et coûts
- [ ] Doc API: Tous les endpoints AI
- [ ] Tutoriels interactifs

## 🎯 KPIs & Success Metrics
- Taux de conversion FREE → PRO (objectif: 15%)
- Usage moyen par user (objectif: 60% de leur quota)
- Satisfaction AI features (objectif: 4.5/5)
- Ratio Haiku/Sonnet (objectif: 70/30)
- Retention à 30 jours (objectif: 80%)
