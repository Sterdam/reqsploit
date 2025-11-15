# ReqSploit Chrome Extension

## 🎯 La Plus-Value de l'Extension

### Avant l'Extension (Workflow Complexe)
```
1. Configurer manuellement proxy dans Chrome (5 étapes)
2. Télécharger certificat depuis dashboard
3. Installer certificat manuellement (10+ clics)
4. Redémarrer navigateur
5. Reconfigurer proxy à chaque session
6. Perdre la configuration à chaque redémarrage
```

### Avec l'Extension (Workflow Simplifié)
```
1. Cliquer sur l'icône ReqSploit
2. Cliquer "Enable Proxy"
3. C'est tout! ✨
```

## 🚀 Fonctionnalités

### Core Features
- ✅ **One-Click Proxy Toggle**: Enable/disable MITM proxy instantanément
- ✅ **Auto Proxy Configuration**: Configure Chrome proxy automatiquement (localhost:8080)
- ✅ **SSL Certificate Download**: Téléchargement certificat en 1 clic
- ✅ **Real-Time Request Counter**: Badge montre nombre de requêtes interceptées
- ✅ **Backend Health Monitor**: Indicateur visuel de connexion backend (vert/rouge)
- ✅ **Quick Actions**: Accès rapide dashboard, docs, certificat
- ✅ **Auto-Reconnect**: Reconnexion automatique si backend redémarre

### UI/UX
- 🎨 **Modern Dark Theme**: Design cohérent avec dashboard principal
- 📊 **Live Stats**: Compteur en temps réel des requêtes
- 🔔 **Notifications**: Alerts pour enable/disable proxy
- ⚡ **Instant Feedback**: Status updates toutes les 2 secondes
- 🎯 **Clean Interface**: Popup minimaliste et efficace

## 📁 Structure de l'Extension

```
extension/
├── manifest.json           # Configuration Manifest V3
├── background.js          # Service worker (proxy management)
├── popup.html            # UI du popup
├── popup.css            # Styles (dark theme)
├── popup.js             # Logic du popup
├── icons/
│   ├── icon16.svg       # Icon 16x16
│   ├── icon48.svg       # Icon 48x48
│   └── icon128.svg      # Icon 128x128
├── create-icons.js      # Script génération icons
├── README.md           # Documentation utilisateur
└── SETUP.md           # Guide d'installation complet
```

## 🔧 Architecture Technique

### Manifest V3 (Latest Chrome Standard)
- **Service Worker**: background.js (remplace background pages)
- **Permissions**: proxy, storage, tabs, webRequest, notifications
- **Host Permissions**: localhost:8080, localhost:3000

### Communication Flow
```
User Click (popup.js)
    ↓
chrome.runtime.sendMessage()
    ↓
Background Service Worker (background.js)
    ↓
Chrome Proxy API / Backend API
    ↓
Response to Popup
    ↓
UI Update (popup.js)
```

### Proxy Configuration
```javascript
{
  mode: 'fixed_servers',
  rules: {
    singleProxy: {
      scheme: 'http',
      host: 'localhost',
      port: 8080
    },
    bypassList: ['localhost', '127.0.0.1']
  }
}
```

### Backend Integration
- **Health Check**: `GET /health` (toutes les 10s)
- **Certificate Download**: `GET /api/proxy/certificate` (public endpoint)
- **Status Sync**: Auto-update badge et UI

## 💡 Use Cases

### For Pentesters
1. **Quick Session**: Click → Enable → Browse → Analyze
2. **Multiple Targets**: Easy switch entre différents projets
3. **Clean Workflow**: Pas de config manuelle à répéter
4. **Professional**: Badge count impressionne en démo client 😎

### For Learners
1. **Easy Setup**: Pas besoin comprendre proxy configuration
2. **Visual Feedback**: Voir requêtes interceptées en temps réel
3. **One-Click Access**: Dashboard toujours à portée de clic
4. **Guided Experience**: Documentation intégrée

### For Developers
1. **API Testing**: Intercepter facilement API calls
2. **Debug HTTPS**: Voir requêtes/réponses HTTPS en clair
3. **Performance**: Analyser temps de réponse
4. **Security**: Tester sécurité de son app

## 🎯 Competitive Advantages

### vs Burp Suite
- ✅ **Modern UI**: Extension Chrome native vs Java app
- ✅ **Faster Setup**: 1 clic vs configuration complexe
- ✅ **AI-Powered**: Analyse intelligente intégrée
- ✅ **Free**: Burp Suite Pro coûte $449/an

### vs Fiddler
- ✅ **Cross-Platform**: Fonctionne partout (Chrome based)
- ✅ **Lightweight**: Pas d'app desktop lourde
- ✅ **AI Analysis**: Fiddler n'a pas d'IA
- ✅ **Modern Tech**: React + TypeScript vs .NET

### vs ZAP Proxy
- ✅ **User-Friendly**: UI plus intuitive
- ✅ **AI-Powered**: Claude 3.5 Sonnet > No AI
- ✅ **Faster**: Extension vs application complète
- ✅ **Better UX**: Design moderne vs UI datée

## 🔐 Sécurité

### Safe by Default
- **Localhost Only**: Fonctionne uniquement en local (dev safe)
- **No External Calls**: Aucune connexion externe ou tracking
- **Temporary Config**: Proxy cleared au restart de Chrome
- **Self-Signed Cert**: Certificat uniquement pour testing

### Best Practices
- ⚠️ **Never on Production**: Uniquement testing autorisé
- ⚠️ **Disable When Done**: Toujours disable proxy après test
- ⚠️ **Trust Certificate Carefully**: Installer uniquement certificat officiel
- ⚠️ **Review Permissions**: Comprendre permissions demandées

## 📊 Metrics & Analytics

### What We Track (Locally)
- Request count (badge)
- Backend connection status
- Proxy enabled/disabled state
- Last certificate download time

### What We DON'T Track
- ❌ User behavior
- ❌ Browsing history
- ❌ Request content
- ❌ Personal information
- ❌ Analytics/telemetry

## 🚀 Installation Rapide

```bash
# 1. Open Chrome Extensions
chrome://extensions/

# 2. Enable Developer Mode (toggle top-right)

# 3. Click "Load unpacked"

# 4. Select: /home/will/burponweb/extension/

# 5. Done! Click ReqSploit icon
```

## 🔮 Future Enhancements

### Phase 1 (Next)
- [ ] Auto-detect backend URL (support remote backends)
- [ ] Token balance display in popup
- [ ] Quick vulnerability summary (count by severity)
- [ ] One-click certificate installation (system level)

### Phase 2
- [ ] Browser profile selection
- [ ] Request filtering directly in popup
- [ ] Export requests from extension
- [ ] Quick AI analysis from popup

### Phase 3
- [ ] Firefox support (WebExtension API)
- [ ] Edge/Brave optimizations
- [ ] Keyboard shortcuts
- [ ] Context menu integration

### Phase 4
- [ ] Scope management from extension
- [ ] Project selection in popup
- [ ] Finding status updates
- [ ] Mobile companion (Android/iOS)

## 📚 Documentation

- **User Guide**: [extension/README.md](extension/README.md)
- **Setup Guide**: [extension/SETUP.md](extension/SETUP.md)
- **API Docs**: [backend/AI_SYSTEM.md](backend/AI_SYSTEM.md)
- **Main README**: [README.md](README.md)

## 🤝 Contribution

L'extension est open-source et contributions welcome!

Areas to contribute:
- Icon design (improve current SVG icons)
- UI/UX improvements
- Bug fixes
- New features
- Documentation
- Translations

## 📝 License

Same as ReqSploit main project.

---

**Built with ❤️ using Chrome Extension Manifest V3**
