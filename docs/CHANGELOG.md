# Changelog - AeroDb

Toutes les modifications notables du projet sont documentées dans ce fichier.

## [1.3.0] - 2026-03-05

### ✨ Nouvelles fonctionnalités

#### Plugin Capacitor USB série natif pour Android (Option C)

Implémentation d'un plugin Capacitor personnalisé en Java pour accéder aux
ports USB série sur Android, contournant la limitation de l'API Web Serial
qui n'est pas disponible dans les WebViews Android.

**Problème résolu :** `navigator.serial` (Web Serial API) n'est supporté que
par Chrome/Edge desktop. Sur Android (APK Capacitor), cette API est absente,
rendant la connexion USB impossible.

**Solution implémentée :** Plugin Capacitor natif (`UsbSerialPlugin.java`)
utilisant la bibliothèque `usb-serial-for-android` + bridge JS transparent
(`androidSerialBridge.js`). Les jauges continuent de recevoir l'événement
`flightdata` sans aucune modification.

### 🔧 Fichiers créés

#### Java (Android natif)
- `android/app/src/main/java/com/example/aerodb/UsbSerialPlugin.java`
  - Plugin Capacitor annoté `@CapacitorPlugin(name = "UsbSerial")`
  - Méthodes : `getPorts()`, `open({ deviceId, baudRate })`, `close()`
  - Événements JS : `serialData` (ligne JSON reçue), `serialState` (connexion/déconnexion)
  - Gestion de la permission USB Android (dialogue runtime, BroadcastReceiver)
  - Lecture en arrière-plan via `SerialInputOutputManager` (thread dédié)
  - Reconstruction des lignes depuis les chunks octets (`StringBuilder lineBuffer`)
  - Supporte CH340, CP210x, FTDI, PL2303, CDC/ACM (Arduino)
- `android/app/src/main/res/xml/device_filter.xml`
  - Filtre USB pour 6 fabricants courants (FTDI, Silicon Labs, WCH, Prolific, Arduino×2)
  - Valeurs `vendor-id` en décimal (requis par Android)

#### JavaScript
- `src/utils/androidSerialBridge.js`
  - Détection synchrone de l'environnement (`window.Capacitor.isNativePlatform()`)
  - Encapsule `Capacitor.Plugins.UsbSerial` avec la même interface que `usbReader`
  - Dispatche le même `CustomEvent 'flightdata'` — les jauges sont aveugles à la source
  - Bannière de reconnexion USB (identique à celle de `usbReader.js`)
  - Gestion des listeners Capacitor avec `.remove()` pour éviter les fuites mémoire

### 🔧 Fichiers modifiés

- `android/app/src/main/java/com/example/aerodb/MainActivity.java`
  - Ajout `registerPlugin(UsbSerialPlugin.class)` avant `super.onCreate()`
- `android/app/src/main/AndroidManifest.xml`
  - Ajout `<uses-feature android:name="android.hardware.usb.host" />`
  - Ajout intent-filter `USB_DEVICE_ATTACHED` + `<meta-data>` vers `device_filter`
- `android/app/build.gradle`
  - Ajout `implementation 'com.github.mik3y:usb-serial-for-android:3.8.1'`
- `android/build.gradle`
  - Ajout `maven { url 'https://jitpack.io' }` dans `allprojects.repositories`
  (était déjà présent)
- `src/utils/usbReader.js`
  - `connect()` : délègue à `androidSerialBridge` si présent, sinon Web Serial API
  - `disconnect()` : idem
  - `_tryAutoConnect()` : chemin Android → `androidSerialBridge.connect()` ;
    chemin desktop inchangé
  - Les getters `isConnected` et `data` restent sur `this._connected` / `this._data`
    (synchronisés manuellement après chaque appel au bridge)
- `partial/gauge_page.html`
  - Ajout `<script src="../src/utils/androidSerialBridge.js">` **avant** `usbReader.js`

### 📖 Documentation

- `docs/packaging.md` : Section "Plugin USB série natif" complète avec
  architecture, API JS, filtre USB, permissions manifeste, tableau des puces,
  checklist de validation et problèmes courants
- `docs/implementation-summary.md` : Section Android USB natif ajoutée
- `docs/CHANGELOG.md` : Cette entrée

### 📊 Compatibilité des puces USB-série

| Puce | vendor-id hex | vendor-id décimal | Produits courants |
|------|--------------|-------------------|-------------------|
| FTDI FT232 | 0x0403 | 1027 | Adaptateurs USB-série de qualité |
| Silicon Labs CP210x | 0x10C4 | 4292 | ESP32 DevKit officiel |
| WCH CH340/CH341 | 0x1A86 | 6790 | Clones Arduino Nano, ESP32 bon marché |
| Prolific PL2303 | 0x067B | 1659 | Câbles USB-série génériques |
| Arduino (ATmega16U2) | 0x2341 | 9025 | Arduino Uno, Mega |
| Arduino (clone) | 0x2A03 | 10755 | Arduino Leonardo, Micro |

### ⚠️ Limitations et prérequis

- Nécessite un câble **USB-OTG** (USB On-The-Go) pour brancher un périphérique
  USB sur l'appareil Android
- La permission USB est demandée lors de la première connexion (une seule fois
  par périphérique)
- iOS non supporté (architecture différente)
- Bluetooth non implémenté dans cette phase (prévu pour une version future)

### 🔄 Compatibilité ascendante

- Desktop (Chrome/Edge/Electron) : **comportement inchangé** — `navigator.serial`
  toujours utilisé
- WiFi (`wifiReader.js`) : **inchangé** sur toutes les plateformes
- Jauges et instruments : **aucune modification requise** — même événement `flightdata`

---

## [1.3.0] - 2026-03-05

### ✨ Nouvelles fonctionnalités

#### Plugin Capacitor natif — USB série Android

Résolution du bug "Web Serial API non supportée sur Android" : l'API
`navigator.serial` n'est disponible que dans Chrome/Edge. Sur Android
(APK Capacitor), le WebView ne la supporte pas. La solution implémentée
est un **plugin Capacitor personnalisé en Java** qui accède directement
à l'USB via l'API Android `android.hardware.usb`.

Bibliothèque Java : `usb-serial-for-android` v3.8.1 (mik3y / JitPack).
Supporte CH340, CP210x, FTDI, PL2303, CDC/ACM (Arduino…).

Comportement au démarrage sur Android :
- Périphérique déjà branché → connexion automatique + dialogue Android (1ère fois)
- Aucun périphérique → bannière "Branchez le périphérique USB puis touchez ici"
- Branchement à chaud → OS relance l'app via `USB_DEVICE_ATTACHED` intent

WiFi : `wifiReader.js` entièrement inchangé, fonctionne en parallèle.

### 🔧 Modifications techniques

#### Android (Java / Gradle)

- `android/app/build.gradle` : dépendance `usb-serial-for-android:3.8.1`
- `android/app/src/main/res/xml/device_filter.xml` : **créé** — filtre des puces USB-série
- `android/app/src/main/AndroidManifest.xml` : `uses-feature usb.host` + intent `USB_DEVICE_ATTACHED`
- `android/app/src/main/java/…/UsbSerialPlugin.java` : **créé** — plugin Capacitor, méthodes `getPorts()`, `open()`, `close()`, événements `serialData` / `serialState`
- `android/app/src/main/java/…/MainActivity.java` : `registerPlugin(UsbSerialPlugin.class)`

#### JavaScript

- `src/utils/androidSerialBridge.js` : **créé** — adaptateur JS → plugin natif, dispatche `'flightdata'`
- `src/utils/usbReader.js` : délégation au bridge sur Android, Web Serial API inchangée sur desktop
- `partial/gauge_page.html` : chargement `androidSerialBridge.js` avant `usbReader.js`

#### Documentation

- `docs/packaging.md` : section plugin entièrement réécrite avec architecture, API, tableau puces, dépannage
- `docs/implementation-summary.md` : section USB Android natif ajoutée

### 📊 Compatibilité

| Plateforme | USB | WiFi |
|------------|-----|------|
| Android APK Capacitor | via plugin Java | inchangé |
| Desktop Chrome / Edge | Web Serial API | inchangé |
| Desktop Electron | Web Serial API | inchangé |

### 📁 Fichiers créés / modifiés

```
android/app/build.gradle                               [MODIFIÉ] dépendance usb-serial
android/app/src/main/AndroidManifest.xml               [MODIFIÉ] USB feature + intent
android/app/src/main/res/xml/device_filter.xml         [CRÉÉ]
android/app/src/main/java/…/UsbSerialPlugin.java       [CRÉÉ]
android/app/src/main/java/…/MainActivity.java          [MODIFIÉ]
src/utils/androidSerialBridge.js                       [CRÉÉ]
src/utils/usbReader.js                                 [MODIFIÉ]
partial/gauge_page.html                                [MODIFIÉ]
docs/packaging.md                                      [MIS À JOUR]
docs/implementation-summary.md                         [MIS À JOUR]
```

---

## [1.3.0] - 2026-03-05

### ✨ Nouvelles fonctionnalités

#### Plugin Capacitor natif — USB série Android

Résolution du bug "Web Serial API non supportée sur Android" : l'API
`navigator.serial` n'est disponible que dans Chrome/Edge. Sur Android
(APK Capacitor), le WebView ne la supporte pas. La solution implémentée
est un **plugin Capacitor personnalisé en Java** qui accède directement
à l'USB via l'API Android `android.hardware.usb`.

**Bibliothèque Java utilisée** : `usb-serial-for-android` v3.8.1 (mik3y,
JitPack) — supporte CH340, CP210x, FTDI, PL2303, CDC/ACM (Arduino…).

**Comportement au démarrage sur Android** :
- Périphérique déjà branché → connexion automatique + dialogue Android (1ère fois)
- Aucun périphérique → bannière "Branchez le périphérique USB puis touchez ici"
- Branchement à chaud → OS relance l'app via `USB_DEVICE_ATTACHED` intent

**WiFi conservé** : `wifiReader.js` entièrement inchangé.

### 🔧 Modifications techniques

- `android/app/build.gradle` : dépendance `usb-serial-for-android:3.8.1`
- `android/app/src/main/res/xml/device_filter.xml` : **créé** — filtre USB (CH340, CP210x, FTDI, PL2303, Arduino)
- `android/app/src/main/AndroidManifest.xml` : `uses-feature usb.host` + intent `USB_DEVICE_ATTACHED`
- `android/app/.../UsbSerialPlugin.java` : **créé** — plugin Capacitor, méthodes `getPorts()` / `open()` / `close()`, événements `serialData` / `serialState`
- `android/app/.../MainActivity.java` : `registerPlugin(UsbSerialPlugin.class)`
- `src/utils/androidSerialBridge.js` : **créé** — bridge JS vers le plugin natif
- `src/utils/usbReader.js` : délégation au bridge sur Android, Web Serial API conservée sur desktop
- `partial/gauge_page.html` : chargement du bridge avant `usbReader.js`

### 📊 Compatibilité

| Plateforme | USB | WiFi |
|------------|-----|------|
| Android (APK Capacitor) | ✅ plugin Java | ✅ inchangé |
| Desktop Chrome/Edge | ✅ Web Serial API | ✅ inchangé |
| Desktop Electron | ✅ Web Serial API | ✅ inchangé |

### 📖 Documentation

- `docs/packaging.md` : réécriture complète de la section "Plugins" avec
  architecture, API JS, tableau des puces, permissions et dépannage
- `docs/implementation-summary.md` : ajout section USB Android natif

---

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
