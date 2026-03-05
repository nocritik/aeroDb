# AeroDb

Outils d'aide à la navigation pour avions ultralégers (ULM) et aviation légère.

## 🎯 Fonctionnalités

### Instruments de vol personnalisables
- Indicateur de vitesse (airspeed)
- Température moteur (eau, CHT, EGT)
- Compas de navigation
- Altimètre
- Variomètre
- Jauge de carburant
- Compte-tours (tachymètre)

### Navigation interactive
- Carte interactive avec Leaflet.js
- Marqueurs d'aérodromes
- Zones aéronautiques
- Suivi de position en temps réel

### Système de configuration avancé ⚙️
- **Modale de configuration** : Interface intuitive accessible depuis la page d'accueil
- **Chargement automatique** de `config.ini` au premier démarrage
- **Trois sources de données** :
  - 🎮 **Simulation** : Générateur de données réalistes pour tests
  - 📡 **WiFi** : Connexion WebSocket vers ESP32/ESP8266
  - 🔌 **USB** : Liaison série avec Arduino ou autre microcontrôleur
- **Deux modes d'exécution** :
  - 🔧 **Développement** : Panneaux de debug visibles
  - 🚀 **Production** : Interface épurée pour le vol

## 🚀 Démarrage rapide

### 1. Lancer un serveur local

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

### 1b. (Optionnel mais requis pour l'enregistrement dans `config.ini`)
Le serveur Node/Express gère la persistance des configurations de jauges
vers `config/config.ini`. **Sans ce serveur, seules les sauvegardes locales
(`localStorage`) fonctionneront ; le fichier restera inchangé**. Lancez-le
à partir de la racine :

```bash
npm install     # première fois
npm start       # écoute sur http://localhost:3000
```

> 🔁 **Important** : ouvrez l'application en accédant à
> `http://localhost:3000/partial/gauge_page.html` (ou remplacez
> `localhost:8000` si vous avez utilisé un autre serveur). Les requêtes
> `/api/gauges` doivent pointer sur le même hôte/port que les pages, sinon
> elles échoueront et vous serez invité à télécharger manuellement un
> `config.ini` à jour.

Vous pouvez laisser ce service tourner en arrière-plan pendant le
développement.


### 2. Ouvrir l'application

Naviguez vers `http://localhost:8000/index.html`

### 3. Configurer l'application

1. Cliquez sur **CONFIGURATION** dans le menu principal
2. Sélectionnez votre environnement (Dev/Prod)
3. Choisissez votre source de données (Simulation/WiFi/USB)
4. Configurez les paramètres spécifiques
5. Enregistrez

## 📋 Configuration

## 📦 Packaging & déploiement

Le projet est en réalité une application web complète : l'UI, les
services et même la persistance s'exécutent dans le navigateur. Pour en faire
une application autonome sur Windows ou Android, il suffit d'encapsuler cette
UI dans un « conteneur » capable d'embarquer un moteur Web (Chromium/V8) et
– lorsque nécessaire – le runtime Node.js.

### 💻 Desktop (Windows/macOS/Linux)

La solution recommandée est **Electron** (Chromium + Node).

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Démarrer le mode développement :
   ```bash
   npm run electron
   ```
   (ouvre une fenêtre contenant l'application et lance le serveur de config
   interne)
3. Générer un exécutable Windows :
   ```bash
   npm run dist-win
   ```
   ou tout-platforme (`npm run dist-all`).

L'exécutable résultant contient son propre moteur V8, un serveur Express
inclus, et tous les fichiers web. Aucune installation de navigateur n'est
requise sur la machine cible.

> **Accès aux ports USB/WiFi**
> Puisque Electron expose Node, on peut utiliser des modules natifs comme
> [`serialport`](https://www.npmjs.com/package/serialport) pour dialoguer
> avec un port série/USB. Le code existant (simulateur/WebSocket) reste
> inchangé ; des adaptateurs peuvent être ajoutés dans
> `electron-preload.js` et dans les contrôleurs de `src/services`.

### 📱 Mobile (Android/iOS)

Electron n'est pas disponible sur Android. Cette section détaille la **phase 1
 – déploiement Android** étape par étape.

#### 1. Pré‑requis

- Node.js installé
- Capacitor CLI global :
  ```bash
  npm install -g @capacitor/cli
  ```
- Android Studio pour la compilation finale

#### 2. Initialisation du projet Capacitor

```bash
cd c:/workspace/aeroDb
npx cap init aeroDb com.example.aerodb
```

Répondez aux questions (nom de l'application, chemin de sortie `www`).

#### 3. Synchronisation des assets web

Un script `npm run sync-www` a été ajouté pour automatiser la copie des
fichiers nécessaires dans `www/` :

```bash
npm run sync-www
```

Il supprimera le contenu précédent et recopiera tout (hors `node_modules`,
`dist`, etc.). Vous pouvez relancer ce script à chaque modification de la
web‑app.

#### 4. Ajouter la plateforme Android

```bash
npx cap add android
```

Cela crée un sous‑répertoire `android/` contenant un projet Android Gradle.

#### 5. Installer les plugins nécessaires

- USB/série : [`@ionic-native/serial`](https://ionicframework.com/docs/native/serial)
- WiFi : [`@capacitor/network`](https://capacitorjs.com/docs/apis/network)

Par exemple :

```bash
npm install @capacitor/network @ionic-native/serial
npx cap sync
```

> Ces plugins exposent des API JavaScript utilisables depuis la même UI que
> sur desktop.

#### 6. Construire l'APK

Ouvrez Android Studio :

```bash
npx cap open android
```

Compilez l'application (`Build → Build Bundle(s) / APK(s)`).

#### 7. Vérification / validation (phase 1)

1. **Quoi vérifier ?**
   - L'application se lance sur un appareil ou un émulateur.
   - La page des instruments affiche les jauges existantes.
   - L'ajout/modification/suppression en local fonctionne (stockage local).
   - `ConfigService.exportIni()` propose un fichier quand on appuie sur la
     disquette en l'absence de serveur.
   - Les plugins USB/WiFi communiquent correctement (tester sur matériel).

2. **Test de déploiement**
   - Installer l'APK sur un vrai appareil Android.
   - Redémarrer, ouvrir l'application, vérifier que les données persistent
     et que les contrôleurs fonctionnent.

3. **Checklist de validation**
   - [ ] Script `sync-www` fonctionne (`npm run sync-www`).
   - [ ] Projet Android se compile sans erreur.
   - [ ] UI responsive dans la WebView.
   - [ ] Aucune exception JavaScript en console (voir `adb logcat`).

Une fois cette phase validée, vous pouvez passer à la phase 2
(Déploiement Windows).
### 🛡️ Alternatives & choix

- **Tauri** : plus léger qu'Electron (Chromium + Rust) et utilisable sur
  desktop. Il ne supporte pas Android, donc pas adapté au « double déploiement
  desktop+mobile ».
- **NW.js** : semblable à Electron mais moins populaire.
- **Flutter WebView** : si vous souhaitez écrire la couche native en Dart.

> Pourquoi ne pas « embarquer notre propre navigateur » ?
> Construire et maintenir un moteur V8/HTML complet est un travail colossal ;
> utiliser une solution existante (Electron, WebView Android, WKWebView iOS)
> vous libère de cette charge. Ces projets gèrent aussi les mises à jour de
> sécurité du moteur beaucoup plus efficacement qu'un bricolage maison.


## 📋 Configuration

### Fichier config.ini

Au premier démarrage, les paramètres sont chargés depuis `config/config.ini` :

```ini
[General]
Environment = dev
DataSource = simulation

[WiFi]
Host = 192.168.4.1
Port = 81

[USB]
Port = COM3
BaudRate = 115200
```

### Modification de la configuration

- **Via l'interface** : Bouton CONFIGURATION dans le menu
- **Réinitialiser** : Effacer localStorage et recharger
  ```javascript
  localStorage.clear();
  location.reload();
  ```

## 📖 Documentation

- **[Guide de configuration](docs/configuration-guide.md)** : Guide utilisateur complet
- **[Résumé d'implémentation](docs/implementation-summary.md)** : Documentation technique
- **[Architecture MVVM](CLAUDE.md)** : Principes de développement

## 🛠️ Technologies

- **Frontend** : Vanilla JavaScript, jQuery 1.12.3, Bootstrap 3.3.6
- **Cartes** : Leaflet.js
- **Instruments** : Canvas Gauge libraries
- **Architecture** : ES6 Modules, MVVM pattern
- **Stockage** : LocalStorage + fichier INI

## 🎨 Mode Développement

En mode développement, deux panneaux sont visibles en bas de la page :

```
┌────────────────────────────────────────────┐
│        Instruments de vol                  │
└────────────────────────────────────────────┘
  ┌──────────────┐  ┌──────────────────┐
  │ Simulateur   │  │ WiFi Config      │
  │ JSON : 5 Hz  │  │ 192.168.4.1:81  │
  │ [Stop]       │  │ [Connect]        │
  └──────────────┘  └──────────────────┘
```

## 🔧 Structure du projet

```
aeroDb/
├── config/               # Configuration
│   └── config.ini       # Fichier de configuration INI
├── src/
│   ├── core/            # Classes de base (Observable, EventBus)
│   ├── models/          # Modèles de données (GaugeConfig)
│   ├── services/        # Services (ConfigService)
│   └── utils/           # Utilitaires
│       ├── jquery-1.12.3.min.js  # jQuery
│       ├── mustache.min.js       # Mustache templates
│       ├── usbReader.js          # Lecteur USB/série
│       ├── usbSimulator.js       # Simulateur de données
│       └── wifiReader.js         # Lecteur WiFi/WebSocket
├── scripts/
│   ├── configManager.js # Gestionnaire de la modale config
│   ├── event.js         # Gestion des événements
│   └── gauge/           # Composants des instruments
│       └── components/  # Jauges individuelles
├── partial/
│   ├── gauge_page.html  # Page des instruments
│   └── nav_page.html    # Page de navigation
├── docs/                # Documentation
│   ├── configuration-guide.md
│   ├── implementation-summary.md
│   └── CHANGELOG.md
└── index.html           # Page d'accueil
```

## 🤝 Contribution

Voir [CLAUDE.md](CLAUDE.md) pour les conventions de code et l'architecture.

## 📄 Licence

Projet personnel - Tous droits réservés
