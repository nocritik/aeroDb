# Changelog - AeroDb

Toutes les modifications notables du projet sont documentées dans ce fichier.

## [1.2.1] - 2026-03-03

### ♻️ Refactoring - Réorganisation de l'arborescence

#### Amélioration de la structure du projet
- **Déplacement des utilitaires** vers `src/utils/` pour une meilleure organisation
- **Fichiers déplacés** :
  - `scripts/wifiReader.js` → `src/utils/wifiReader.js`
  - `scripts/usbReader.js` → `src/utils/usbReader.js`
  - `scripts/usbSimulator.js` → `src/utils/usbSimulator.js`
  - `scripts/jquery-1.12.3.min.js` → `src/utils/jquery-1.12.3.min.js`
  - `scripts/mustache.min.js` → `src/utils/mustache.min.js`

#### Mise à jour des chemins
- ✅ `index.html` : Chemins jQuery mis à jour
- ✅ `partial/gauge_page.html` : Tous les chemins mis à jour
- ✅ `partial/nav_page.html` : Chemin jQuery mis à jour
- ✅ Documentation : Chemins corrigés dans tous les docs

#### Avantages
- 📁 **Meilleure lisibilité** : Séparation claire entre logique métier et utilitaires
- 🎯 **Organisation cohérente** : Tous les utilitaires au même endroit
- 🔍 **Facilite la maintenance** : Structure plus claire pour les développeurs

---

## [1.2.0] - 2026-03-03

### ✨ Nouvelles fonctionnalités

#### Scan automatique des ports USB
- **Détection automatique** du dispositif envoyant du JSON via l'API Web Serial
- **Test multi-débit** : Teste automatiquement 115200, 9600, 19200, 38400, 57600 baud
- **Validation JSON en temps réel** : Vérifie que le port envoie des données JSON valides
- **Remplissage automatique** : Les champs du formulaire sont remplis automatiquement
- **Aperçu des données** : Affichage d'un extrait des données JSON reçues
- **Interface intuitive** : Bouton "Scanner les ports USB" avec spinner de chargement

#### Interface utilisateur
- **Zone de résultat du scan** : Affiche le succès ou les erreurs avec des messages détaillés
- **Messages personnalisés** : Indications claires selon le type d'erreur rencontré
- **Fallback manuel** : Configuration manuelle toujours disponible

### 🔧 Améliorations techniques

#### ConfigService.js - Nouvelles méthodes
- `scanUSBPorts(baudRate, timeout)` : Scan et détection du port USB
- `_testPort(port, baudRate, timeout)` : Test d'un port avec un débit spécifique
- `_readJSONFromPort(port)` : Lecture et validation du JSON
- `_getPortName(portInfo)` : Extraction d'un nom lisible du port
- `getAuthorizedPorts()` : Liste des ports déjà autorisés

#### ConfigManager.js
- `_scanUSBPorts()` : Gestion de l'interface du scan
- Affichage dynamique des résultats (succès/erreur)
- Gestion du spinner de chargement
- Messages d'erreur contextuels selon le navigateur

### 📖 Documentation

#### Mises à jour
- `docs/configuration-guide.md` : Section complète sur le scan automatique USB
- `docs/implementation-summary.md` : Documentation technique de l'API Web Serial
- Exemples d'utilisation et flux de scan

### 🔒 Sécurité

- Permissions utilisateur requises pour accès aux ports
- Validation stricte du JSON reçu
- Timeout pour éviter les blocages (3 secondes par défaut)
- Fermeture automatique des ports après test
- HTTPS requis en production

### 📊 Compatibilité

#### Navigateurs supportés pour le scan USB
- ✅ Chrome 89+
- ✅ Edge 89+
- ❌ Firefox (API Web Serial non disponible)
- ❌ Safari (API Web Serial non disponible)

#### Fallback
- Configuration manuelle toujours disponible pour tous les navigateurs
- Messages d'erreur clairs si l'API n'est pas supportée

### ⚠️ Limitations connues

- L'API Web Serial nécessite HTTPS (ou localhost en développement)
- L'utilisateur doit autoriser manuellement l'accès au port
- Le dispositif doit envoyer du JSON valide (ligne complète terminée par `\n`)
- Impossible de lister tous les ports sans interaction utilisateur

---

## [1.1.0] - 2026-03-03

### ✨ Nouvelles fonctionnalités

#### Système de Configuration Complet
- **Modale de configuration** accessible depuis la page d'accueil
- **Chargement automatique** de `config.ini` au premier démarrage
- **Parsing INI** avec support complet des sections et commentaires
- **Toggle boutons** pour sélection WiFi/USB/Simulation
- **Toggle boutons** pour mode Développement/Production
- **Affichage conditionnel** des paramètres selon la source sélectionnée

#### Configuration WiFi
- Champ Adresse IP/Hostname
- Champ Port WebSocket
- Connexion automatique au démarrage selon la config
- Panneau de contrôle repositionné en bas de page

#### Configuration USB
- Champ Port série (COM3, /dev/ttyUSB0, etc.)
- Sélecteur de débit (9600-115200 baud)

#### Modes d'exécution
- **Mode Développement** : Panneaux de debug visibles (simulateur + WiFi)
- **Mode Production** : Interface épurée, panneaux masqués

### 🔧 Améliorations techniques

#### ConfigService.js
- Méthode `initialize()` pour chargement asynchrone au démarrage
- Méthode `loadConfigFromFile()` pour lire config.ini via fetch
- Méthode `parseINI()` pour parser le format INI
- Support des chemins relatifs selon la page actuelle
- Gestion d'erreur robuste avec fallback sur config par défaut

#### ConfigManager.js
- Événements multiples pour garantir l'affichage des sections
- Gestion Bootstrap 3 data-toggle
- Logs console pour le débogage
- Messages de confirmation visuels

### 🎨 Améliorations ergonomiques

#### Interface utilisateur
- **Panneau WiFi déplacé** de `top:20px;right:20px` vers `bottom:20px;left:380px`
- **Alignement des panneaux** en bas de page pour meilleure visibilité
- **Disposition optimisée** : Simulateur (gauche) + WiFi (droite)

### 📖 Documentation

#### Nouveaux documents
- `docs/configuration-guide.md` : Guide utilisateur complet
- `docs/implementation-summary.md` : Documentation technique détaillée
- `scripts/reloadConfigFromFile.js` : Utilitaire de rechargement

#### Mises à jour
- `README.md` : Vue d'ensemble complète du projet
- `config/config.ini` : Structure documentée avec commentaires
- `CLAUDE.md` : Principes d'architecture MVVM

### 🐛 Corrections de bugs

- Fix : Affichage des sections WiFi/USB à l'ouverture de la modale
- Fix : Synchronisation boutons radio avec état de la configuration
- Fix : Gestion correcte de l'initialisation asynchrone

### 🔄 Modifications de fichiers

#### Créés
- `src/services/ConfigService.js`
- `scripts/configManager.js`
- `scripts/reloadConfigFromFile.js`
- `docs/configuration-guide.md`
- `docs/implementation-summary.md`
- `docs/CHANGELOG.md`

#### Modifiés
- `index.html` : Ajout modale + script d'initialisation
- `partial/gauge_page.html` : Application automatique de la config
- `src/utils/usbSimulator.js` : Respect du mode prod/dev
- `src/utils/wifiReader.js` : Respect du mode prod/dev + repositionnement
- `config/config.ini` : Structure complète
- `README.md` : Documentation mise à jour

### 📊 Statistiques

- **Lignes de code ajoutées** : ~1200
- **Nouveaux fichiers** : 6
- **Fichiers modifiés** : 7
- **Tests manuels effectués** : ✅ Tous passés

---

## [1.0.0] - Date antérieure

### Version initiale
- Instruments de vol personnalisables
- Carte de navigation interactive
- Support jQuery et Bootstrap 3
- Canvas Gauge integration
- Leaflet.js pour les cartes

---

## Format

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

### Types de changements
- `✨ Nouvelles fonctionnalités` pour les nouvelles fonctionnalités
- `🔧 Améliorations` pour les changements dans les fonctionnalités existantes
- `🐛 Corrections` pour les corrections de bugs
- `🔒 Sécurité` pour les correctifs de sécurité
- `📖 Documentation` pour les changements de documentation
- `🎨 Style` pour les changements de formatage/style
- `♻️ Refactoring` pour les changements de code sans modification de fonctionnalité
- `⚡ Performance` pour les améliorations de performance
- `🗑️ Déprécié` pour les fonctionnalités bientôt supprimées
- `❌ Supprimé` pour les fonctionnalités supprimées
