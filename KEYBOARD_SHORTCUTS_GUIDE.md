# 🎹 ReqSploit - Guide des Raccourcis Clavier

**Date:** 2025-11-18
**Version:** 1.0

---

## 📋 Vue d'Ensemble

ReqSploit supporte maintenant des raccourcis clavier avancés inspirés de Vim pour une navigation rapide et efficace.

---

## 🧭 Navigation dans la Liste de Requêtes

### Navigation de Base
| Touche | Action | Description |
|--------|--------|-------------|
| `j` | Requête suivante | Sélectionne la requête suivante dans la liste |
| `k` | Requête précédente | Sélectionne la requête précédente dans la liste |
| `gg` | Aller au début | Saute à la première requête (appuyer 2x sur `g`) |
| `G` | Aller à la fin | Saute à la dernière requête (Shift + g) |

### Actions Rapides
| Touche | Action | Description |
|--------|--------|-------------|
| `/` | Focus recherche | Focus la barre de recherche (fonctionne partout) |
| `a` | Sélectionner tout | Sélectionne toutes les requêtes visibles |
| `t` | Menu tags | Ouvre le menu de tagging (à venir) |
| `i` | Mode édition | Toggle mode édition (à venir) |

---

## 🔀 Changement de Vues

### Raccourcis Numériques
| Touche | Vue | Description |
|--------|-----|-------------|
| `1` | History | Affiche l'historique des requêtes |
| `2` | Intercept | Affiche le panneau d'interception |
| `3` | Repeater | Affiche le panneau Repeater |
| `4` | Decoder | Affiche le panneau Decoder |
| `5` | Intruder | Affiche le panneau Intruder |

---

## 🎯 Raccourcis Existants (Ctrl/Cmd)

### Actions sur les Requêtes
| Raccourci | Action | Description |
|-----------|--------|-------------|
| `Ctrl/Cmd + I` | Toggle Intercept | Active/désactive le mode interception |
| `Ctrl/Cmd + R` | Send to Repeater | Envoie la requête au Repeater |
| `Ctrl/Cmd + D` | Open Decoder | Ouvre le Decoder |
| `Ctrl/Cmd + Shift + I` | Send to Intruder | Envoie la requête à l'Intruder |

### Interface
| Raccourci | Action | Description |
|-----------|--------|-------------|
| `Ctrl/Cmd + /` | Aide | Affiche la modale d'aide |
| `?` | Aide rapide | Affiche l'aide des raccourcis |
| `Esc` | Fermer | Ferme les modales ouvertes |

---

## ⚙️ Configuration

### Mode Vim
Le mode Vim est **activé par défaut** et persiste via localStorage.

Pour désactiver le mode Vim :
```javascript
// Dans la console du navigateur
localStorage.setItem('vimMode', 'false');
```

Pour réactiver :
```javascript
localStorage.setItem('vimMode', 'true');
```

---

## 🔍 Détection Intelligente

### Protection dans les Inputs
Les raccourcis sont **automatiquement désactivés** quand vous tapez dans :
- Champs de texte (`<input>`)
- Zones de texte (`<textarea>`)
- Éléments éditables (`contentEditable`)

**Exception** : La touche `/` fonctionne **toujours** pour focus la recherche.

---

## 💡 Astuces d'Utilisation

### Workflow Rapide
1. **Navigation** : Utilisez `j`/`k` pour parcourir les requêtes
2. **Recherche** : Appuyez `/` pour chercher rapidement
3. **Vues** : Utilisez `1-5` pour changer de panneau
4. **Actions** : Utilisez `Ctrl+R` pour envoyer au Repeater

### Exemple de Workflow
```
1. Appuyer '2' → Ouvre Intercept
2. Intercepter quelques requêtes
3. Appuyer 'j' → Naviguer dans la liste
4. Appuyer 'Ctrl+R' → Envoyer au Repeater
5. Appuyer '3' → Voir dans Repeater
6. Appuyer '1' → Retour à l'historique
```

---

## 🐛 Dépannage

### Les raccourcis ne fonctionnent pas
1. **Vérifier le mode Vim** : `localStorage.getItem('vimMode')`
2. **Vérifier que vous n'êtes pas dans un input**
3. **Rafraîchir la page** si nécessaire

### La touche 'gg' ne fonctionne pas
- Appuyez 2x sur `g` **dans les 500ms**
- Assurez-vous de ne pas être dans un champ de texte

### Conflit avec les raccourcis du navigateur
- Les raccourcis Vim (`j`/`k`/`gg`/`G`) sont des touches simples, pas de conflit
- Les raccourcis système (`Ctrl+R`, etc.) utilisent des modificateurs

---

## 🎨 Personnalisation Future

### Fonctionnalités Prévues
- [ ] Configuration UI pour désactiver/activer le mode Vim
- [ ] Personnalisation des raccourcis
- [ ] Macros et séquences personnalisées
- [ ] Export/import de configurations

---

## 📚 Références

- **Vim Navigation** : Inspiré de Vim/Vi pour la rapidité
- **Design Pattern** : Custom React Hook avec détection d'événements
- **Persistance** : localStorage pour les préférences utilisateur

---

**Enjoy la navigation rapide ! 🚀**
