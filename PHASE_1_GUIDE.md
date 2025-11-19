# 🧪 PHASE 1 - GUIDE DE TEST DÉTAILLÉ
## Proxy Core & Request Capture

**Date**: 2025-11-17
**User de test**: test@test.com
**Tokens disponibles**: 1,000,000

---

## 🎯 OBJECTIF
Vérifier que le proxy MITM capture correctement le trafic HTTP/HTTPS et stocke les requêtes dans la base de données.

---

## ✅ PRÉREQUIS

### Backend
```bash
cd /home/will/burponweb/backend
npm run dev
# ✅ Vérifier que le serveur démarre sur http://localhost:3000
```

### Frontend
```bash
cd /home/will/burponweb/frontend
npm run dev
# ✅ Vérifier que le frontend démarre sur http://localhost:5173
```

### Connexion
1. Ouvrir http://localhost:5173
2. Se connecter avec:
   - Email: `test@test.com`
   - Password: `password123` (ou celui que tu as défini)

---

## 📝 ÉTAPE 1.1 - Démarrer une Session Proxy

### Actions
1. Dans le Dashboard, cliquer sur **"Start Proxy"**
2. Observer l'interface

### Vérifications ✓
- [ ] **Bouton devient "Stop Proxy"**
- [ ] **Port du proxy s'affiche** (ex: Port: 8080)
- [ ] **Status indicateur passe au vert**
- [ ] **Certificat CA disponible** au téléchargement
- [ ] **WebSocket connecté** (check console réseau)

### Problèmes possibles
| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Bouton grisé | Pas authentifié | Vérifier JWT token valide |
| Port non affiché | Proxy crash | Check logs backend `npm run dev` |
| Erreur "Port in use" | Port 8080 déjà utilisé | Changer dans .env ou kill process |

### Logs attendus (Backend)
```
[ProxyManager] Proxy session created for user: test@test.com
[ProxyManager] Proxy listening on port: 8080
[WebSocket] proxy:started emitted to user
```

---

## 📝 ÉTAPE 1.2 - Configurer Navigateur/Outil

### Option A: Firefox (Recommandé)
1. Ouvrir Firefox Settings → Network Settings
2. Sélectionner "Manual proxy configuration"
3. HTTP Proxy: `127.0.0.1`
4. Port: `8080` (le port affiché dans l'UI)
5. ✅ Cocher "Also use this proxy for HTTPS"
6. Cliquer OK

### Option B: Burp Suite (pour comparaison)
1. Proxy → Options → Proxy Listeners
2. Add: `127.0.0.1:8081` (port différent)
3. Upstream Proxy: `127.0.0.1:8080` (notre proxy)

### Option C: cURL (tests rapides)
```bash
# HTTP simple
curl -x http://127.0.0.1:8080 http://httpbin.org/get

# HTTPS (nécessite certificat CA)
curl -x http://127.0.0.1:8080 https://httpbin.org/get --insecure
```

### Installer le Certificat CA (IMPORTANT pour HTTPS)

#### Firefox
1. Télécharger le certificat depuis l'UI
2. Firefox Settings → Privacy & Security → Certificates
3. View Certificates → Authorities → Import
4. Sélectionner `reqsploit-ca-*.crt`
5. ✅ Cocher "Trust this CA to identify websites"

#### Chrome/Edge
1. Settings → Privacy and security → Security
2. Manage certificates → Authorities → Import
3. Sélectionner le certificat
4. ✅ Cocher "Trust this certificate for identifying websites"

---

## 📝 ÉTAPE 1.3 - Capturer Requêtes HTTP/HTTPS

### Test 1: Requête HTTP Simple
```bash
# Depuis Firefox configuré
http://httpbin.org/get
```

**Vérifications ✓**
- [ ] Requête apparaît dans **History Panel**
- [ ] Method: `GET`
- [ ] URL: `http://httpbin.org/get`
- [ ] Status Code: `200`
- [ ] Headers visibles (User-Agent, Accept, etc.)
- [ ] Response body visible

### Test 2: Requête HTTPS (après install CA)
```bash
https://httpbin.org/get
```

**Vérifications ✓**
- [ ] Requête interceptée sans erreur SSL
- [ ] Certificat TLS valide (check padlock dans navigateur)
- [ ] Headers HTTPS visibles
- [ ] Response déchiffrée correctement

### Test 3: Requête POST avec Body
```bash
# Dans Firefox
https://httpbin.org/post
```
Ou avec cURL:
```bash
curl -x http://127.0.0.1:8080 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"demo123"}' \
  https://httpbin.org/post
```

**Vérifications ✓**
- [ ] Method: `POST`
- [ ] Request body stocké: `{"username":"test","password":"demo123"}`
- [ ] Content-Type header présent
- [ ] Response body avec echo des données

### Test 4: Requête avec Headers Custom
```bash
curl -x http://127.0.0.1:8080 \
  -H "X-Custom-Header: MyValue" \
  -H "Authorization: Bearer fake-token-123" \
  https://httpbin.org/headers
```

**Vérifications ✓**
- [ ] Headers custom capturés
- [ ] Authorization header visible (sensible!)
- [ ] Response montre headers reçus

---

## 📝 ÉTAPE 1.4 - Tester Intercept Mode

### Activer Intercept Mode
1. Dans l'UI, aller à **Intercept Panel**
2. Activer toggle **"Intercept Mode"**
3. Faire une requête

### Test: Hold Request
```bash
curl -x http://127.0.0.1:8080 https://httpbin.org/delay/2
```

**Vérifications ✓**
- [ ] Requête apparaît dans **Intercept Queue**
- [ ] Requête en état "HELD"
- [ ] cURL bloqué en attente
- [ ] Actions disponibles: Forward / Drop / Modify

### Test: Forward Request
1. Cliquer **"Forward"**

**Vérifications ✓**
- [ ] Requête envoyée au serveur
- [ ] Response reçue
- [ ] cURL se débloque
- [ ] Requête passe dans History

### Test: Drop Request
1. Faire nouvelle requête
2. Cliquer **"Drop"**

**Vérifications ✓**
- [ ] Requête supprimée de la queue
- [ ] cURL reçoit erreur/timeout
- [ ] Requête NOT dans History (droppée)

### Test: Modify Request
1. Faire nouvelle requête vers `https://httpbin.org/get?original=value`
2. Dans Intercept, cliquer **"Modify"**
3. Changer query param: `?original=value` → `?modified=newvalue`
4. Cliquer **"Forward Modified"**

**Vérifications ✓**
- [ ] Modal de modification s'ouvre
- [ ] Peut éditer URL, Headers, Body
- [ ] Requête modifiée envoyée
- [ ] Response montre `?modified=newvalue`

---

## 📝 ÉTAPE 1.5 - Vérifier Storage dans DB

### Via Prisma Studio
```bash
npx prisma studio --port 5555
# Ouvrir http://localhost:5555
```

1. Aller à table **RequestLog**
2. Vérifier entrées récentes

**Vérifications ✓**
- [ ] Toutes les requêtes capturées sont dans DB
- [ ] userId correspond à test@test.com
- [ ] timestamp correct
- [ ] method stocké correctement
- [ ] url complet stocké
- [ ] headers en JSON valide
- [ ] body stocké (pour POST)
- [ ] statusCode présent
- [ ] responseHeaders stockés
- [ ] responseBody stocké
- [ ] duration calculé

### Via API (optionnel)
```bash
# Get requests for current user
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/proxy/requests?limit=10
```

---

## 📝 ÉTAPE 1.6 - Tester Filtres

### Filtre par Domaine
1. Dans History Panel, ouvrir **Filters**
2. Ajouter domaine: `httpbin.org`
3. Faire requêtes vers:
   - `https://httpbin.org/get` ✅ Visible
   - `https://example.com` ❌ Cachée

**Vérifications ✓**
- [ ] Seules requêtes vers httpbin.org visibles
- [ ] Filtre persistant (refresh page)
- [ ] Peut désactiver filtre

### Filtre par Method
1. Filtre: Method = `POST`
2. Faire GET et POST

**Vérifications ✓**
- [ ] Seules requêtes POST visibles
- [ ] Peut sélectionner multiple methods

### Filtre par URL Pattern
1. Filtre: URL contains `/api/`
2. Faire requêtes vers:
   - `https://httpbin.org/api/users` ✅
   - `https://httpbin.org/get` ❌

**Vérifications ✓**
- [ ] Filtrage par pattern fonctionne
- [ ] Case-insensitive

### Filtre par Status Code
1. Filtre: Status = `200`
2. Faire requêtes:
   - `https://httpbin.org/status/200` ✅
   - `https://httpbin.org/status/404` ❌

**Vérifications ✓**
- [ ] Filtrage par status code
- [ ] Multiple status codes possibles

---

## 🔍 VÉRIFICATIONS GLOBALES

### Headers
- [ ] **User-Agent** capturé
- [ ] **Cookie** capturé
- [ ] **Authorization** capturé
- [ ] **Custom headers** capturés
- [ ] **Content-Type** (POST) capturé

### Body (POST/PUT)
- [ ] **JSON** body stocké
- [ ] **Form data** (application/x-www-form-urlencoded) stocké
- [ ] **Multipart form** (file uploads) stocké
- [ ] **Binary data** géré correctement

### WebSocket Real-time
- [ ] **request:intercepted** event reçu
- [ ] **response:received** event reçu
- [ ] **proxy:stats** mis à jour
- [ ] Pas de lag UI (updates en <100ms)

### Performance
- [ ] **10 requêtes/sec**: Pas de lag ✅
- [ ] **50 requêtes/sec**: Léger lag acceptable ⚠️
- [ ] **100+ requêtes/sec**: Peut ralentir (normal)
- [ ] **Memory usage**: Stable (<500MB backend)

---

## 🐛 PROBLÈMES FRÉQUENTS

### 1. "Certificate not trusted"
**Cause**: CA certificate non installé
**Solution**: Suivre étape 1.2 installation certificat

### 2. "Connection refused" dans navigateur
**Cause**: Proxy non démarré ou mauvais port
**Solution**: Vérifier proxy actif et port correct

### 3. Requêtes HTTPS non capturées
**Cause**: CA certificate invalide ou proxy pas en MITM
**Solution**: Régénérer certificat, vérifier HTTPS proxy settings

### 4. Body vide dans DB (POST)
**Cause**: Content-Type non supporté ou parsing erreur
**Solution**: Check logs backend, vérifier Content-Type

### 5. WebSocket déconnecté
**Cause**: JWT expiré ou backend crash
**Solution**: Reconnecter, vérifier logs backend

---

## ✅ CHECKLIST FINALE PHASE 1

- [ ] **1.1** - Proxy démarre correctement
- [ ] **1.2** - Navigateur configuré avec proxy + CA
- [ ] **1.3** - Requêtes HTTP et HTTPS capturées
- [ ] **1.4** - Intercept mode (hold/forward/drop/modify) fonctionne
- [ ] **1.5** - Toutes requêtes stockées dans DB
- [ ] **1.6** - Filtres (domain/method/URL/status) fonctionnels
- [ ] **Performance** - Pas de lag sur trafic normal
- [ ] **WebSocket** - Real-time updates fonctionnent
- [ ] **0 erreurs** dans console frontend/backend

---

## 📊 RAPPORT DE TEST

**Date**: _________
**Testeur**: _________
**Durée**: _________ min

### Résultats
- Étapes complétées: ___/6
- Vérifications passées: ___/~40
- Problèmes détectés: ___
- Corrections nécessaires: ___

### Notes
_Ajouter ici tout problème, observation ou suggestion..._

---

**Next**: Phase 2 - Intercept Panel & AI Analysis
