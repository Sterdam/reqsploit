# 🧪 PLAN DE TEST COMPLET - BurpOnWeb v1.0.0

**Date**: 2025-11-17
**Version**: v1.0.0-complete
**Objectif**: Test systématique de toutes les fonctionnalités avec amélioration continue

---

## 📊 PROGRESSION GLOBALE

- **Phase 0**: ✅ COMPLÉTÉE - Préparation et Nettoyage (5/5 étapes) - 15 min
- **Phase 1**: ⏸️ EN ATTENTE - Proxy Core & Request Capture (0/6 étapes)
- **Phase 2**: ⏸️ EN ATTENTE - Intercept Panel & AI Analysis (0/8 étapes)
- **Phase 3**: ⏸️ EN ATTENTE - Repeater & AI Test Suggestions (0/8 étapes)
- **Phase 4**: ⏸️ EN ATTENTE - Intruder & Payload Generation (0/8 étapes)
- **Phase 5**: ⏸️ EN ATTENTE - AI Findings & False Positives (0/10 étapes)
- **Phase 6**: ⏸️ EN ATTENTE - Batch Processing & Smart Suggestions (0/8 étapes)
- **Phase 7**: ⏸️ EN ATTENTE - Analysis History & Comparison (0/9 étapes)
- **Phase 8**: ⏸️ EN ATTENTE - Cost Tracking & Analytics (0/8 étapes)
- **Phase 9**: ⏸️ EN ATTENTE - Cross-Panel Workflows (0/6 étapes)
- **Phase 10**: ⏸️ EN ATTENTE - UI/UX & Responsive (0/8 étapes)
- **Phase 11**: ⏸️ EN ATTENTE - Data Consistency & Best Practices (0/8 étapes)

**Total**: 5/86 étapes complétées (5.8%)

---

## PHASE 0 : Préparation et Nettoyage ✅

**Objectif**: Nettoyer la base de code et préparer l'environnement de test

### Étapes

- [x] **0.1**: Inventaire des fichiers .md à nettoyer
  - Status: ✅ COMPLÉTÉ
  - Fichiers trouvés: 41 fichiers .md
  - À garder: README.md, DEPLOYMENT_READY.md, TESTING_PLAN.md

- [x] **0.2**: Supprimer tous les .md obsolètes
  - Status: ✅ COMPLÉTÉ
  - Action: Supprimé 38 fichiers obsolètes

- [x] **0.3**: Analyser et résoudre tous les TODO/FIXME dans le code
  - Status: ✅ COMPLÉTÉ (Analysé - 4 TODO réels détectés)
  - TODO réels:
    1. RequestList.tsx:792 - Delete single request (MOYENNE)
    2. AIFindingsPanel.tsx:353 - Navigate to request (MOYENNE)
    3. AIAnalysisHistory.tsx:156 - Get plan from auth store (FAIBLE)
    4. ai.routes.ts:292 - Fetch vulnerabilities relation (MOYENNE)
  - Faux positifs: 4 (commentaires techniques, pas des TODO)

- [x] **0.4**: Vérifier la cohérence du modèle de données (Prisma schema)
  - Status: ✅ COMPLÉTÉ
  - Résultat:
    - 15 modèles, 28 relations, 68 indexes
    - Cascade deletes cohérents
    - User-scoped security stricte partout
    - Enums bien définis

- [x] **0.5**: Vérifier les bonnes pratiques de stockage/modification des données
  - Status: ✅ COMPLÉTÉ
  - Résultat:
    - User-scoped queries partout ✅
    - Error handling présent ✅
    - Validation inputs ✅
    - Pas de logging backend structuré ⚠️

### Résultats Phase 0
- Temps estimé: 15-20 min
- Temps réel: 15 min
- Problèmes détectés: 4 TODO réels (non-bloquants)
- Corrections effectuées: 0 (en attente de décision)
- **Rapport détaillé**: Voir `PHASE_0_REPORT.md`

---

## PHASE 1 : Proxy Core & Request Capture ⏸️

**Objectif**: Vérifier la capture de trafic et le stockage des requêtes

### Étapes

- [ ] **1.1**: Démarrer une session proxy
- [ ] **1.2**: Configurer navigateur/outil pour utiliser le proxy
- [ ] **1.3**: Capturer requêtes HTTP/HTTPS basiques
- [ ] **1.4**: Tester interception mode (hold/modify/forward)
- [ ] **1.5**: Vérifier storage dans DB (RequestLog)
- [ ] **1.6**: Tester filtres (domains, methods, URL patterns)

### Vérifications
- [ ] Headers correctement capturés
- [ ] Body (POST/PUT) correctement stocké
- [ ] WebSocket real-time updates fonctionnent
- [ ] Performance (pas de lag sur trafic intense)

### Résultats Phase 1
- Temps estimé: 30 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 2 : Intercept Panel & AI Analysis ⏸️

**Objectif**: Tester l'analyse AI des requêtes interceptées

### Étapes

- [ ] **2.1**: Intercepter une requête avec données sensibles
- [ ] **2.2**: Tester "Analyze Request" (AI Haiku par défaut)
- [ ] **2.3**: Tester "Analyze Response"
- [ ] **2.4**: Tester "Full Transaction Analysis"
- [ ] **2.5**: Tester sélection modèle (Haiku vs Sonnet)
- [ ] **2.6**: Vérifier détection de vulnérabilités (XSS, SQLi, etc.)
- [ ] **2.7**: Tester "Explain" sur une vulnérabilité
- [ ] **2.8**: Vérifier confidence scores et badges

### Vérifications
- [ ] Token usage affiché correctement
- [ ] Coût prévu vs coût réel cohérents
- [ ] Résultats AI cohérents et pertinents
- [ ] Performance (temps de réponse AI acceptable)

### Résultats Phase 2
- Temps estimé: 45 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 3 : Repeater & AI Test Suggestions ⏸️

**Objectif**: Tester la modification de requêtes et les suggestions AI

### Étapes

- [ ] **3.1**: Envoyer requête depuis Intercept vers Repeater
- [ ] **3.2**: Modifier headers/body dans Repeater
- [ ] **3.3**: Tester "Send" multiple fois
- [ ] **3.4**: Ouvrir AI Panel dans Repeater
- [ ] **3.5**: Tester "AI Suggest Tests" (5-12 tests attendus)
- [ ] **3.6**: Appliquer une suggestion de test
- [ ] **3.7**: Vérifier que modifications sont appliquées
- [ ] **3.8**: Tester historique des envois

### Vérifications
- [ ] AI suggestions pertinentes (SQLi, XSS, Auth bypass, etc.)
- [ ] Modifications appliquées correctement
- [ ] Historique cohérent
- [ ] Workflow Repeater → Intruder fonctionne

### Résultats Phase 3
- Temps estimé: 40 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 4 : Intruder & Payload Generation ⏸️

**Objectif**: Tester les attaques par injection de payloads

### Étapes

- [ ] **4.1**: Envoyer requête vers Intruder
- [ ] **4.2**: Marquer positions d'injection (§param§)
- [ ] **4.3**: Tester payload types (Simple list, Numbers, etc.)
- [ ] **4.4**: Tester "AI Generate Payloads"
- [ ] **4.5**: Lancer attaque simple (10-20 requêtes)
- [ ] **4.6**: Vérifier résultats (status, length, timing)
- [ ] **4.7**: Tester filtres de résultats
- [ ] **4.8**: Exporter résultats

### Vérifications
- [ ] Payloads AI pertinents pour le contexte
- [ ] Rate limiting respecté
- [ ] Résultats cohérents
- [ ] Export fonctionne (JSON/CSV)

### Résultats Phase 4
- Temps estimé: 35 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 5 : AI Findings & False Positives ⏸️

**Objectif**: Tester la gestion des vulnérabilités et false positives

### Étapes

- [ ] **5.1**: Analyser 5-10 requêtes différentes
- [ ] **5.2**: Ouvrir AI Findings Panel (unified view)
- [ ] **5.3**: Tester filtres (severity, type, confidence)
- [ ] **5.4**: Tester virtual scrolling (100+ findings si possible)
- [ ] **5.5**: Dismiss une vulnérabilité comme false positive
- [ ] **5.6**: Créer pattern depuis FP
- [ ] **5.7**: Tester auto-suppression (analyser requête similaire)
- [ ] **5.8**: Ouvrir FP Management Panel
- [ ] **5.9**: Vérifier stats (total dismissed, patterns, confidence)
- [ ] **5.10**: Toggle/delete patterns

### Vérifications
- [ ] Pattern matching fonctionne (70%+ confidence)
- [ ] Auto-suppression effective
- [ ] Stats cohérentes
- [ ] Performance UI (virtual scrolling fluide)

### Résultats Phase 5
- Temps estimé: 40 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 6 : Batch Processing & Smart Suggestions ⏸️

**Objectif**: Tester le traitement parallèle et les suggestions intelligentes

### Étapes

- [ ] **6.1**: Sélectionner 10-15 requêtes dans History
- [ ] **6.2**: Cliquer "Smart Batch Suggestions"
- [ ] **6.3**: Vérifier groupes suggérés (domain, path, method)
- [ ] **6.4**: Sélectionner 2-3 groupes
- [ ] **6.5**: Appliquer sélection
- [ ] **6.6**: Lancer "Batch Analyze" (5 concurrent)
- [ ] **6.7**: Vérifier performance metrics (duration, avgTime)
- [ ] **6.8**: Comparer avec analyse séquentielle (si possible)

### Vérifications
- [ ] Groupes intelligents et pertinents
- [ ] Confidence scores >70%
- [ ] Speedup 3-4x vs séquentiel
- [ ] Métriques affichées correctement

### Résultats Phase 6
- Temps estimé: 45 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 7 : Analysis History & Comparison ⏸️

**Objectif**: Tester l'historique et la comparaison d'analyses

### Étapes

- [ ] **7.1**: Ouvrir AI Analysis History
- [ ] **7.2**: Vérifier timeline grouping (Today, Yesterday, etc.)
- [ ] **7.3**: Tester filtres (severity, date, URL)
- [ ] **7.4**: Tester search
- [ ] **7.5**: Sélectionner 2 analyses pour comparaison
- [ ] **7.6**: Ouvrir Comparison View
- [ ] **7.7**: Vérifier diff (new/fixed/changed/unchanged)
- [ ] **7.8**: Exporter comparison en Markdown
- [ ] **7.9**: Vérifier stats dashboard (4 metrics cards)

### Vérifications
- [ ] Diff algorithm précis
- [ ] Color-coding clair
- [ ] Export Markdown formaté correctement
- [ ] Stats cohérentes

### Résultats Phase 7
- Temps estimé: 35 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 8 : Cost Tracking & Analytics ⏸️

**Objectif**: Vérifier le suivi des coûts et analytics

### Étapes

- [ ] **8.1**: Vérifier AI Credits Widget (tokens remaining)
- [ ] **8.2**: Ouvrir Cost Breakdown Modal
- [ ] **8.3**: Vérifier onglet "Breakdown" (actions + coûts)
- [ ] **8.4**: Vérifier onglet "Comparison" (Haiku vs Sonnet)
- [ ] **8.5**: Vérifier onglet "Predictions" (trends + month-end)
- [ ] **8.6**: Faire plusieurs analyses pour voir évolution
- [ ] **8.7**: Vérifier token usage en temps réel
- [ ] **8.8**: Tester alertes (si proche de la limite)

### Vérifications
- [ ] Calculs de coûts corrects (Haiku=1x, Sonnet=12x)
- [ ] Charts visuels clairs
- [ ] Prédictions cohérentes
- [ ] Transparence SaaS vs API cost

### Résultats Phase 8
- Temps estimé: 30 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 9 : Cross-Panel Workflows ⏸️

**Objectif**: Tester la navigation et synchronisation entre panels

### Étapes

- [ ] **9.1**: Intercept → Send to Repeater (auto-switch tab)
- [ ] **9.2**: Repeater → Send to Intruder (auto-switch + load)
- [ ] **9.3**: Vérifier toast notifications
- [ ] **9.4**: Vérifier workflow history tracking
- [ ] **9.5**: Tester navigation stack (back/forward)
- [ ] **9.6**: Vérifier activePanel sync dans Dashboard

### Vérifications
- [ ] Event bus fonctionne
- [ ] Auto-switch fluide
- [ ] Toasts informatifs
- [ ] Pas de perte de contexte

### Résultats Phase 9
- Temps estimé: 25 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 10 : UI/UX & Responsive ⏸️

**Objectif**: Vérifier l'expérience utilisateur et responsive design

### Étapes

- [ ] **10.1**: Tester responsive design (desktop, tablet, mobile)
- [ ] **10.2**: Vérifier portal dropdowns (z-index correct)
- [ ] **10.3**: Tester scroll horizontal (RepeaterAIPanel)
- [ ] **10.4**: Vérifier loading states partout
- [ ] **10.5**: Tester error boundaries (forcer erreur)
- [ ] **10.6**: Vérifier messages d'erreur clairs
- [ ] **10.7**: Tester accessibility (keyboard navigation)
- [ ] **10.8**: Vérifier badges pulsants (AI panel)

### Vérifications
- [ ] UI cohérente et professionnelle
- [ ] Pas de bugs visuels
- [ ] Performance fluide
- [ ] Accessibility conforme

### Résultats Phase 10
- Temps estimé: 30 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## PHASE 11 : Data Consistency & Best Practices ⏸️

**Objectif**: Vérifier la cohérence des données et bonnes pratiques

### Étapes

- [ ] **11.1**: Vérifier Prisma schema (relations, indexes)
- [ ] **11.2**: Tester cascade deletes (supprimer user → data?)
- [ ] **11.3**: Vérifier user-scoped security (pas de leaks)
- [ ] **11.4**: Tester error handling (DB errors, AI timeouts)
- [ ] **11.5**: Vérifier transactions (où nécessaire)
- [ ] **11.6**: Tester data migration (FP patterns)
- [ ] **11.7**: Vérifier logging (pas de secrets loggés)
- [ ] **11.8**: Tester rate limiting AI (si implémenté)

### Vérifications
- [ ] Modèle de données cohérent
- [ ] Sécurité user-scoped stricte
- [ ] Pas de SQL injection possible
- [ ] Error handling robuste

### Résultats Phase 11
- Temps estimé: 40 min
- Temps réel: -
- Problèmes détectés: -
- Corrections effectuées: -

---

## 📝 JOURNAL DES PROBLÈMES DÉTECTÉS

### Problème #1
- **Phase**: -
- **Description**: -
- **Sévérité**: -
- **Status**: -
- **Correction**: -

---

## 🎯 MÉTRIQUES FINALES

- **Temps total estimé**: ~440 minutes (~7h20)
- **Temps total réel**: -
- **Problèmes détectés**: 0
- **Problèmes corrigés**: 0
- **Taux de réussite**: -

---

**Dernière mise à jour**: 2025-11-17
**Status global**: ⏳ Phase 0 en cours
