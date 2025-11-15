# 🔍 Debug Extension Communication

## Étape 1: Vérifier le chargement de l'extension

1. Ouvre Chrome et va sur `chrome://extensions`
2. Active le "Mode développeur" (en haut à droite)
3. Vérifie l'extension "ReqSploit":
   - ✅ Le chemin doit être: `.../burponweb/extension/dist`
   - ✅ L'ID affiché (noter cet ID!)
   - ✅ Pas d'erreurs affichées

## Étape 2: Vérifier l'ID dans .env

1. Ouvre `/home/will/burponweb/frontend/.env.development`
2. Vérifie que `VITE_EXTENSION_ID=` correspond EXACTEMENT à l'ID de chrome://extensions
3. Si différent, mets à jour le fichier .env avec le bon ID
4. Redémarre le serveur frontend: `npm run dev`

## Étape 3: Tester la communication

Ouvre la console Chrome (F12) sur `http://localhost:5173` et colle ce script:

```javascript
// Script de diagnostic extension
const EXTENSION_ID = 'hpmfahfdffceigfjfbpmiabibhpfnbfd'; // Remplace par l'ID réel

console.log('🔍 Testing ReqSploit Extension Communication');
console.log('Extension ID:', EXTENSION_ID);
console.log('Current URL:', window.location.href);
console.log('Chrome runtime available:', typeof chrome !== 'undefined' && !!chrome.runtime);

if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('Sending ping message...');

    chrome.runtime.sendMessage(
        EXTENSION_ID,
        { action: 'ping' },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Extension error:', chrome.runtime.lastError.message);
                console.log('Possible causes:');
                console.log('1. Extension not loaded from dist/ directory');
                console.log('2. Extension ID is incorrect');
                console.log('3. Extension crashed or disabled');
                console.log('4. externally_connectable not configured');
            } else if (response) {
                console.log('✅ Extension responded:', response);
                if (response.success && response.installed) {
                    console.log('🎉 Extension communication working!');
                }
            } else {
                console.error('❌ No response from extension');
            }
        }
    );
} else {
    console.error('❌ Chrome runtime API not available (are you in Chrome?)');
}
```

## Étape 4: Vérifier le manifest de l'extension

Ouvre le fichier dans l'extension chargée:
- `chrome-extension://[ID]/manifest.json`

Vérifie qu'il contient bien:
```json
"externally_connectable": {
  "matches": [
    "http://localhost:5173/*",
    "http://localhost:3000/*",
    "https://*.reqsploit.com/*"
  ]
}
```

## Étape 5: Vérifier le background script

Ouvre la console du service worker de l'extension:
1. Sur chrome://extensions
2. Trouve ReqSploit
3. Clique sur "Service worker" (ou "background page")
4. Une console s'ouvre
5. Vérifie s'il y a des erreurs

Tu devrais voir des logs comme:
```
ReqSploit extension installed
```

## Solutions courantes

### Problème: Extension ID change à chaque rechargement

**Solution**: Créer un fichier `key` dans le manifest

```bash
cd /home/will/burponweb/extension
# Générer une clé privée
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem
# Extraire la clé publique
openssl rsa -in key.pem -pubout -outform DER | base64 -w 0 > key.txt
```

Puis ajoute dans `public/manifest.json`:
```json
{
  "key": "[contenu de key.txt]",
  ...
}
```

### Problème: Message "Could not establish connection"

**Causes possibles**:
1. Extension pas chargée depuis `dist/`
2. `externally_connectable` manquant ou mal configuré
3. Extension crashée (regarde dans chrome://extensions)

**Solution**:
1. Recharge l'extension depuis le bon dossier
2. Rebuild: `npm run build`
3. Recharge l'extension dans Chrome

### Problème: Extension détectée mais token sync fail

**Vérification**:
```javascript
// Dans console extension (Service Worker)
chrome.storage.local.get(['apiToken'], (result) => {
    console.log('Stored token:', result.apiToken);
});
```

## Test manuel complet

1. **Ouvre 2 consoles**:
   - Console webapp (localhost:5173)
   - Console extension (Service Worker)

2. **Dans console webapp**, exécute:
```javascript
chrome.runtime.sendMessage(
    'hpmfahfdffceigfjfbpmiabibhpfnbfd',
    { action: 'setAuthToken', token: 'test-12345' },
    (response) => console.log('Response:', response)
);
```

3. **Dans console extension**, vérifie:
```javascript
chrome.storage.local.get(['apiToken'], console.log);
```

Si tu vois `{ apiToken: 'test-12345' }`, la communication fonctionne! ✅

## Fichiers importants

- Extension source: `/home/will/burponweb/extension/src/background/background.ts`
- Extension compilée: `/home/will/burponweb/extension/dist/`
- Manifest: `/home/will/burponweb/extension/public/manifest.json`
- Frontend extension lib: `/home/will/burponweb/frontend/src/lib/extension.ts`
- Frontend .env: `/home/will/burponweb/frontend/.env.development`
