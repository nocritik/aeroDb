# Packaging et déploiement

Ce document récapitule les opérations nécessaires pour transformer le code
source d'AeroDb en applications autonomes sur Desktop (Windows/macOS/Linux)
et Mobile (Android). Il couvre également les étapes de vérification pour
chaque phase.

---

## Phase 1 : Android (Capacitor)

### Préparation

1. Installez les dépendances du projet et Capacitor :
   ```bash
   npm install       # peut prendre quelques minutes
   npm install -g @capacitor/cli
   ```
   > ⚠️ Si vous rencontrez une erreur `ETARGET` liée à `electron-builder`,
   > vérifiez que la version spécifiée dans `package.json` est valide.
   > Le projet recommande une version 26.x ou ultérieure (par exemple
   > `^26.8.1` pour electron-builder) et **la version d’Electron** peut être
   > élevée jusqu’à la dernière stable (40.x au moment de l’écriture). Choisissez
   > une combinaison compatible. Mettez à jour puis relancez
   > `npm install`.
   >
   > ⚠️ Vous verrez probablement plusieurs avertissements du type
   > `npm WARN deprecated …` lors de l'installation. Ils proviennent de
   > dépendances transitives (inflight, rimraf, glob, etc.) utilisées par
   > Electron/Electron Builder. Ces avertissements n'empêchent pas
   > l'installation ni l'exécution ; maintenez simplement vos packages à jour
   > pour les réduire.
2. Initialisez Capacitor (si ce n'est pas déjà fait) :
   ```bash
   cd /chemin/vers/aeroDb
   npx cap init aeroDb com.example.aerodb
   ```
   - `webDir` doit pointer sur le dossier `www` (valeur par défaut).

### Copier l'application web

Un utilitaire permet de synchroniser automatiquement les fichiers :
```
npm run sync-www
```
Il efface puis copie l'ensemble du projet (sauf `node_modules`, `dist`,
`www` lui-même, fichiers Git) dans `www/`.

*Si vous modifiez le code web, exécutez de nouveau ce script avant de
recompiler l’APK.*

### Ajouter la plate-forme Android

```bash
npx cap add android
```

### Plugins (facultatifs)

Installez les plugins nécessaires pour accéder aux périphériques :

```bash
npm install @capacitor/network @ionic-native/serial
npx cap sync
```

Les API JavaScript de ces plugins peuvent être utilisées directement depuis
la même UI que pour la version desktop.

### Compilation de l'APK

1. Ouvrez le projet Android dans Android Studio :
   ```bash
   npx cap open android
   ```
2. Dans Android Studio, choisissez **Build → Build Bundle(s) / APK(s)**.
3. Récupérez l'APK généré et installez‑le sur un appareil ou un émulateur.

### Vérification / Validation

- [ ] L'application se lance et affiche la page des instruments.
- [ ] Les paramètres de configuration s'enregistrent dans `localStorage`.
- [ ] `ConfigService.exportIni()` déclenche le téléchargement d'un fichier
      lorsque le serveur n'est pas présent.
- [ ] Scan USB / WiFi fonctionne via les plugins (le cas échéant).
- [ ] Aucun message d'erreur JavaScript dans `adb logcat`.
- [ ] L'application redémarre sans perdre ses réglages.

---

## Phase 2 : Desktop (Windows/macOS/Linux)

### Préparation

Electron est nécessaire ; il embarque Chromium (V8) et Node.js.

```bash
npm install
```

### Mode développement

Lancer la fenêtre Electron et démarrer le serveur interne :

```bash
npm run electron
```

### Génération d'un exécutable

Créer une version Windows (NSIS installer) :

```bash
npm run dist-win
```

Un exécutable se trouve alors dans `dist/`. Double‑cliquez pour installer
ou exécuter.

### Vérification / Validation

- [ ] La fenêtre s'ouvre correctement et affiche la même interface que dans
      le navigateur.
- [ ] Le serveur de configuration est démarré automatiquement (vérifiez la
      console Electron pour les logs `Config server listening ...`).
- [ ] Les sauvegardes se répercutent dans `config/config.ini` du package
      (emplacement modifié si l'utilisateur a choisi un autre dossier).
- [ ] Les ports USB/WiFi sont accessibles (utiliser `serialport` ou autre si
      nécessaire).
- [ ] L'application peut être fermée et relancée sans perte de données.

---

## Notes générales

- Le moteur Web embarqué est celui fourni par Chromium/Electron ou
  WebView Android ; il n'est **pas nécessaire** de développer ou maintenir
  un navigateur personnalisé.
- Le packaging inclut tous les fichiers web, le serveur Express et les
  dépendances Node nécessaires.
- Pour des mises à jour plus avancées, envisagez un système d'auto‑update
  (Electron Builder supporte les mises à jour différentielles via GitHub
  Releases ou un serveur privé).

---

Ce document doit être mis à jour à chaque fois que la procédure de
packaging évolue (nouvelle version de Capacitor, ajout d'une plate‑forme,
changement dans la structure du projet, etc.).
