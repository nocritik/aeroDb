# Packaging et déploiement

Ce document récapitule les opérations nécessaires pour transformer le code
source d'AeroDb en applications autonomes sur Desktop (Windows/macOS/Linux)
et Mobile (Android). Il couvre également les étapes de vérification pour
chaque phase.

---

## Phase 1 : Android (Capacitor)

### Préparation

1. Installez les dépendances du projet et Capacitor :
   ```bash
   npm install       # peut prendre quelques minutes
   npm install -g @capacitor/cli
   ```
   > ⚠️ Si vous rencontrez une erreur `ETARGET` liée à `electron-builder`,
   > vérifiez que la version spécifiée dans `package.json` est valide.
   > Le projet recommande une version 26.x ou ultérieure (par exemple
   > `^26.8.1` pour electron-builder) et **la version d'Electron** peut être
   > élevée jusqu'à la dernière stable (40.x au moment de l'écriture). Choisissez
   > une combinaison compatible. Mettez à jour puis relancez
   > `npm install`.
   >
   > ⚠️ Vous verrez probablement plusieurs avertissements du type
   > `npm WARN deprecated …` lors de l'installation. Ils proviennent de
   > dépendances transitives (inflight, rimraf, glob, etc.) utilisées par
   > Electron/Electron Builder. Ces avertissements n'empêchent pas
   > l'installation ni l'exécution ; maintenez simplement vos packages à jour
   > pour les réduire.
2. Initialisez Capacitor (si ce n'est pas déjà fait) :
   ```bash
   cd /chemin/vers/aeroDb
   npx cap init aeroDb com.example.aerodb
   ```
   - `webDir` doit pointer sur le dossier `www` (valeur par défaut).

### Copier l'application web

Un utilitaire permet de synchroniser automatiquement les fichiers :
```
npm run sync-www
```
Il efface puis copie l'ensemble du projet (sauf `node_modules`, `dist`,
`www` lui-même, fichiers Git) dans `www/`.

*Si vous modifiez le code web, exécutez de nouveau ce script avant de
recompiler l'APK.*

### Ajouter la plate-forme Android

```bash
npx cap add android
```

---

### Plugin USB série natif — UsbSerialPlugin (implémenté)

> L'API Web Serial (`navigator.serial`) n'est **pas disponible** dans les
> WebViews Android. Le projet embarque un **plugin Capacitor personnalisé**
> écrit en Java qui contourne cette limitation.

#### Architecture du plugin

```
Android (USB-OTG)                  Desktop (Chrome/Edge)
        │                                   │
UsbSerialPlugin.java               navigator.serial
(android/app/src/main/java/…)      (Web Serial API native)
        │                                   │
        │  notifyListeners()                │
        ▼                                   │
androidSerialBridge.js             usbReader._startReading()
(src/utils/androidSerialBridge.js) (src/utils/usbReader.js)
        │                                   │
        └─────────────────┬─────────────────┘
                          ▼
               CustomEvent  'flightdata'
                          ▼
         Toutes les jauges ← wifiReader.js (WiFi inchangé)
```

#### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `android/app/src/main/java/com/example/aerodb/UsbSerialPlugin.java` | Plugin Capacitor natif (Java) |
| `android/app/src/main/java/com/example/aerodb/MainActivity.java` | Enregistrement du plugin |
| `android/app/src/main/res/xml/device_filter.xml` | Filtre USB (puces reconnues) |
| `android/app/src/main/AndroidManifest.xml` | Permissions + intent USB_DEVICE_ATTACHED |
| `android/app/build.gradle` | Dépendance `usb-serial-for-android:3.8.1` |
| `android/build.gradle` | Dépôt JitPack |
| `src/utils/androidSerialBridge.js` | Adaptateur JS → plugin natif |
| `src/utils/usbReader.js` | Délégation au bridge sur Android |
| `partial/gauge_page.html` | Chargement du bridge avant `usbReader.js` |

#### Dépendance Java — usb-serial-for-android

La bibliothèque [`usb-serial-for-android`](https://github.com/mik3y/usb-serial-for-android)
(mik3y, v3.8.1) gère automatiquement les puces USB-série les plus répandues :

| Puce | Produits courants |
|------|-------------------|
| CH340 / CH341 | Clones Arduino Nano, modules ESP32 bon marché |
| CP210x (Silicon Labs) | ESP32 DevKit officiel, Arduino pro |
| FTDI FT232 | Adaptateurs USB-série de qualité |
| Prolific PL2303 | Câbles USB-série génériques |
| CDC/ACM | Arduino Uno/Leonardo (puce ATmega16U2) |

Configurée dans `android/app/build.gradle` :
```gradle
implementation 'com.github.mik3y:usb-serial-for-android:3.8.1'
```
Dépôt JitPack requis dans `android/build.gradle` :
```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
```

#### API exposée côté JavaScript

Accessible via `window.Capacitor.Plugins.UsbSerial` ou `androidSerialBridge` :

```js
// Lister les périphériques connectés
const { ports } = await Capacitor.Plugins.UsbSerial.getPorts();
// ports = [ { deviceId, vendorId, productId, deviceName, driverName }, … ]

// Ouvrir le premier port à 9600 baud
await Capacitor.Plugins.UsbSerial.open({ deviceId: ports[0].deviceId, baudRate: 9600 });

// Fermer
await Capacitor.Plugins.UsbSerial.close();

// Écouter les données (une ligne JSON par événement)
Capacitor.Plugins.UsbSerial.addListener('serialData', (event) => {
    const data = JSON.parse(event.data);  // { roll, pitch, heading, … }
});

// Écouter les changements d'état
Capacitor.Plugins.UsbSerial.addListener('serialState', (event) => {
    console.log(event.connected, event.error);
});
```

En pratique, `androidSerialBridge.js` encapsule ces appels et expose la même
interface que `usbReader.js` (`connect()`, `disconnect()`, `isConnected`, `data`).

#### Filtre USB — puces reconnues automatiquement

Le fichier `android/app/src/main/res/xml/device_filter.xml` liste les
`vendor-id` en décimal pour les puces USB-série courantes. L'OS Android
propose automatiquement d'ouvrir AeroDb quand un de ces périphériques
est branché (câble USB-OTG).

| vendor-id (décimal) | vendor-id (hex) | Fabricant |
|---------------------|-----------------|-----------|
| 1027 | 0x0403 | FTDI |
| 4292 | 0x10C4 | Silicon Labs |
| 6790 | 0x1A86 | WCH (CH340/CH341) |
| 1659 | 0x067B | Prolific |
| 9025 | 0x2341 | Arduino officiel |
| 10755 | 0x2A03 | Arduino clone |

#### Permissions AndroidManifest.xml

Ajoutées dans `android/app/src/main/AndroidManifest.xml` :
```xml
<!-- Déclare la capacité USB Host -->
<uses-feature android:name="android.hardware.usb.host" android:required="false" />

<!-- Ouvre l'app quand un périphérique USB connu est branché -->
<intent-filter>
    <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
</intent-filter>
<meta-data
    android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
    android:resource="@xml/device_filter" />
```

La permission USB est demandée **au moment de la connexion** (dialogue Android
standard — une seule fois par périphérique). Aucune déclaration supplémentaire
dans le manifeste n'est requise pour `android.hardware.usb`.

#### Enregistrement du plugin dans MainActivity.java

```java
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UsbSerialPlugin.class);  // AVANT super.onCreate()
        super.onCreate(savedInstanceState);
    }
}
```

---

### Comportement USB au démarrage de l'APK

| Situation | Comportement |
|-----------|-------------|
| Périphérique USB branché au lancement | Connexion automatique, dialogue de permission si 1ère fois |
| Aucun périphérique | Bannière "Branchez le périphérique USB puis touchez ici" |
| Périphérique branché après démarrage | Android relance/remet l'app au premier plan (via intent-filter) |
| Connexion perdue (câble débranché) | Événement `serialState { connected: false }` → bannière |

---

### Compilation de l'APK

Avant de compiler, synchroniser les fichiers web :
```bash
npm run sync-www      # copie les sources dans www/
npx cap add android   #Ajoute la plateforme android
npx cap sync android  # applique les plugins Capacitor
npx cap open android  # ouvre Android Studio
```

Dans Android Studio : **Build → Build Bundle(s) / APK(s)**.

#### Problèmes courants

- **Échec de téléchargement des dépendances (bad_record_mac, TLS, proxy)**
  - Le build Gradle nécessite un accès Internet à `https://dl.google.com`,
    `https://maven.google.com` et `https://jitpack.io`.
  - Assurez-vous qu'aucun proxy SSL interceptant ne bloque l'accès.
  - Utilisez JDK 11 ou supérieur (17 recommandé).

- **`USB_DEVICE_ATTACHED` ne lance pas l'app**
  - Vérifiez que le `vendor-id` du périphérique figure dans `device_filter.xml`.
  - Ajoutez l'entrée manquante (valeur décimale) et recompilez.

- **Permission USB jamais accordée**
  - Désinstallez puis réinstallez l'APK pour réinitialiser les permissions.
  - Sur certains appareils, le dialogue n'apparaît qu'après avoir débranché/rebranché.

- **`UsbSerialPlugin` non trouvé au runtime**
  - Vérifiez que `registerPlugin(UsbSerialPlugin.class)` est appelé **avant**
    `super.onCreate()` dans `MainActivity.java`.

- **Erreur de version Gradle/Gradle Plugin**
  - Assurez-vous que la version du plugin Android (`com.android.tools.build:gradle`)
    est compatible avec la version de Gradle utilisée par Capacitor. Android
    Studio propose généralement la mise à jour automatique.

### Vérification / Validation

- [ ] L'application se lance et affiche la page des instruments.
- [ ] Les paramètres de configuration s'enregistrent dans `localStorage`.
- [ ] `ConfigService.exportIni()` déclenche le téléchargement d'un fichier
      lorsque le serveur n'est pas présent.
- [ ] Brancher un périphérique USB → dialogue de permission Android affiché.
- [ ] Après permission accordée → jauges animées par les données USB.
- [ ] Débrancher le câble → bannière de reconnexion affichée.
- [ ] WiFi fonctionne en parallèle de l'USB (sources indépendantes).
- [ ] Aucun message d'erreur JavaScript dans `adb logcat`.
- [ ] L'application redémarre sans perdre ses réglages.

---

## Phase 2 : Desktop (Windows/macOS/Linux)

### Préparation

Electron est nécessaire ; il embarque Chromium (V8) et Node.js.

```bash
npm install
```

### Mode développement

Lancer la fenêtre Electron et démarrer le serveur interne :

```bash
npm run electron
```

### Génération d'un exécutable

Créer une version Windows (NSIS installer) :

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
- [ ] Les ports USB sont accessibles via Web Serial API (Chrome/Edge intégré
      dans Electron).
- [ ] L'application peut être fermée et relancée sans perte de données.

---

## Notes générales

- Le moteur Web embarqué est celui fourni par Chromium/Electron ou
  WebView Android ; il n'est **pas nécessaire** de développer ou maintenir
  un navigateur personnalisé.
- Le packaging inclut tous les fichiers web, le serveur Express et les
  dépendances Node nécessaires.
- Pour des mises à jour plus avancées, envisagez un système d'auto‑update
  (Electron Builder supporte les mises à jour différentielles via GitHub
  Releases ou un serveur privé).
- **Bluetooth** : non implémenté à ce stade. Une future phase pourrait
  ajouter le support BLE (`@capacitor-community/bluetooth-le`) comme
  alternative sans fil à l'USB.

---

Ce document doit être mis à jour à chaque fois que la procédure de
packaging évolue (nouvelle version de Capacitor, ajout d'une plate‑forme,
changement dans la structure du projet, etc.).
