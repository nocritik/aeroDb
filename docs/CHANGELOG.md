# Changelog - AeroDb

Toutes les modifications notables du projet sont documentées dans ce fichier.

## [1.5.0] - 2026-03-06

### ✨ Bille d'inclinomètre (slip/skid indicator) — coordinateur de virage

#### Nouveau champ JSON : `slip`
- Champ `slip` ajouté au protocole (normalisé −1 … +1, 0 = centré)
- `arduino/sendJson/sendJson.ino` : génération sinusoïdale `slip` (phase 2.1)
- `src/utils/usbSimulator.js` : champ `slip` ajouté dans `_updateFrame()`
- `docs/usb-json-protocol.md` : tableau et exemple JSON mis à jour

#### Implémentation côté instruments
- `scripts/gauge/components/jquery.flightindicators.js`
  - Template HTML `turn_coordinator` : ajout `<div class="slip-container"><div class="slip-ball"></div></div>`
  - Fonction privée `_setSlip(slip)` : déplace la bille CSS selon la valeur slip
  - Trajectoire parabolique : `topPct = 30 - slip² × 16` (suit la courbe géométrique réelle du tube SVG)
  - Méthode publique `indicator.setSlip(slip)` exposée
  - Initialisation : `_setSlip(settings.slip || 0)`
- `scripts/gauge/components/addGauge.js`
  - Listener `flightdata` du `turn_coordinator` : appel `indicator.setSlip(e.detail.slip)` si présent

#### CSS — container transparent (approche propre)
- `css/flightindicators.css`
  - `div.slip-container` : fond **transparent**, aligné sur le tube SVG (top:57%, left:28%, width:45%, height:14%, border-radius:50%, overflow:hidden)
  - `div.slip-ball` : sphère CSS animée (gradient radial noir/gris, transition 250ms)
  - Position repos : top:30% → centre bille = 51.5% = centre géométrique du tube SVG

#### Correction SVG `img/turn_coordinator.svg`
- Ajout `viewBox="0 0 537.94183 539.90863"` (manquant — rendu incorrect dans le navigateur)
- Correction `preserveAspectRatio="xMidYMid meet"` (valeur invalide `X200Y200` corrigée)
- Bille statique masquée (`fill-opacity:0`, `opacity:0`) — remplacée par la bille CSS animée
- Textes superflus masqués (`fill:none`) pour correspondre au visuel de référence

### Fichiers modifiés
- `arduino/sendJson/sendJson.ino` — ajout champ `slip`
- `src/utils/usbSimulator.js` — ajout champ `slip`
- `scripts/gauge/components/jquery.flightindicators.js` — `setSlip()`, template HTML, trajectoire parabolique
- `scripts/gauge/components/addGauge.js` — listener `slip` dans `turn_coordinator()`
- `css/flightindicators.css` — container transparent + bille animée
- `img/turn_coordinator.svg` — viewBox, bille statique masquée, textes nettoyés
- `docs/usb-json-protocol.md` — champ `slip` documenté

---

## [1.4.0] - 2026-03-06

### Fluidité des instruments de vol

#### Canvas gauges (jauges à aiguille)
- `GaugeAnimationDuration` ajouté dans `config.ini` (défaut : 1000 ms)
- Règle : durée animation > intervalle données pour éviter les saccades
- `updateValueOnAnimation: true` déjà présent — l'aiguille ne s'arrête jamais entre deux trames

#### Flight indicators (instruments image — horizon, compas, altimètre…)
- `addGauge.js` : remplacement des `setInterval(100ms)` par des listeners `flightdata` directs
- `flightindicators.css` : ajout `transition: 250ms linear` sur tous les éléments rotatifs
- Règle : `transition CSS = intervalle Arduino × 1.25`

#### Arduino sketch
- `SEND_INTERVAL_MS` : 500 ms → 200 ms (2 Hz → 5 Hz)
- Arduino Nano suffisant ; ESP32 recommandé pour un EFIS avec capteurs réels

### Fichiers modifiés
- `config/config.ini` — `GaugeAnimationDuration = 1000`
- `src/services/ConfigService.js` — default `gaugeAnimationDuration: 1000`
- `partial/gauge_page.html` — fallback `|| 1000`
- `scripts/gauge/components/addGauge.js` — flight indicators sur `flightdata`
- `css/flightindicators.css` — `transition: 250ms linear` sur éléments mobiles
- `arduino/sendJson/sendJson.ino` — `SEND_INTERVAL_MS = 200`

---

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
  - Filtre USB pour 6 fabricants courants (FTDI, Silicon Labs, WCH, Prolific, Arduino x2)
  - Valeurs `vendor-id` en décimal (requis par Android)

#### JavaScript
- `src/utils/androidSerialBridge.js`
  - Détection synchrone de l'environnement (`window.Capacitor.isNativePlatform()`)
  - Encapsule `Capacitor.Plugins.UsbSerial` avec la même interface que `usbReader`
  - Dispatche le même `CustomEvent 'flightdata'` — les jauges sont aveugles à la source
  - Bannière de reconnexion USB (identique à celle de `usbReader.js`)
  - Gestion des listeners Capacitor avec `.remove()` pour éviter les fuites mémoire

#### Arduino (test hardware)
- `arduino/sendJson/sendJson.ino`
  - Émetteur de trames JSON pour valider l'ensemble de la chaîne USB
  - 24 champs JSON couvrant tous les instruments (`roll`, `pitch`, `heading`, `speed`, `rpm`, `water*`, `cht*`, `egt*`, `fuel*`, `vario`, `compass`, `altitude`…)
  - Valeurs sinusoïdales avec phases décalées — chaque instrument varie indépendamment
  - Plages : 0–150 (standard), 0–900 (EGT), 0–50 (carburant), ±30°/±15° (attitude), 0–359° (cap)
  - Baud rate : 115 200 (configurable via `BAUD_RATE`) — idem `config.ini → BaudRate`
  - Compatible Arduino Nano/Uno (CH340, ATmega16U2) et ESP32
  - `#include <Arduino.h>` inclus pour l'IntelliSense VSCode

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
- `partial/gauge_page.html`
  - Ajout `<script src="../src/utils/androidSerialBridge.js">` **avant** `usbReader.js`

### 📖 Documentation

- `docs/packaging.md` : Section "Plugin USB série natif" complète avec
  architecture, API JS, filtre USB, permissions manifeste, tableau des puces,
  checklist de validation et problèmes courants
- `docs/implementation-summary.md` : Section Android USB natif ajoutée
- `docs/usb-json-protocol.md` : Baud rate par défaut corrigé (115 200), sketch de test référencé
- `docs/modes-fonctionnement.md` : Réécrit pour refléter l'architecture ConfigService actuelle

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
