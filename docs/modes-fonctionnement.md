# Modes de fonctionnement

## Configuration de la source de données

La source active est définie dans `config/config.ini` (section `[General]`) :

```ini
[General]
Environment = dev        ; dev | prod
DataSource  = usb        ; simulation | wifi | usb
```

Elle peut aussi être modifiée via la modale **CONFIGURATION** accessible
depuis la page d'accueil (`index.html`). La configuration est persistée dans
`localStorage` et lue au démarrage par `ConfigService.initialize()`.

Au chargement de `gauge_page.html`, la bonne source est démarrée automatiquement :

```
config.ini  →  DataSource = ?
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
      simulation wifi    usb
          │       │       │
  jsonSimulator  wifiReader  usbReader
  .start(5Hz)  .connect()  auto-connect
```

---

## Mode `simulation`

**Usage :** test de l'interface sans aucun matériel connecté.

`jsonSimulator.start()` dispatche `CustomEvent('flightdata')` en boucle
(2–20 Hz configurables) avec des valeurs sinusoïdales + bruit.

Le panneau de contrôle est visible en mode **dev** uniquement (`Environment = dev`).
En mode `prod`, il est masqué automatiquement.

```
jsonSimulator.start(5 Hz)
      │
      ▼
CustomEvent('flightdata', { detail: { roll, pitch, speed, … } })
      │
      ▼
Toutes les jauges — mise à jour immédiate
```

---

## Mode `wifi`

**Usage :** microcontrôleur ESP32/ESP8266 en point d'accès WiFi.

`wifiReader.connect(host, port)` ouvre une connexion WebSocket vers
`ws://host:port`. Chaque message JSON reçu est dispatché comme `flightdata`.

```ini
[WiFi]
Host = 192.168.4.1
Port = 81
```

Le panneau de contrôle WiFi est visible en mode **dev** uniquement.

---

## Mode `usb`

**Usage :** microcontrôleur branché en USB (Arduino, ESP32…).

### Desktop — Chrome / Edge / Electron

`usbReader` utilise l'API Web Serial (`navigator.serial`).
Au chargement de `gauge_page.html` (`DOMContentLoaded`) :

```
1. navigator.serial.getPorts()
        │
        ├── port(s) déjà autorisé(s) → connexion silencieuse automatique
        │
        └── aucun port autorisé → bannière "Cliquez ici pour connecter…"
                  │
                  └── clic utilisateur → dialog sélection port → connexion
```

> La sélection de port nécessite un geste utilisateur (contrainte de
> sécurité du navigateur). Les utilisations suivantes sont entièrement
> automatiques.

### Android — APK Capacitor

`navigator.serial` n'est pas disponible dans le WebView Android.
`androidSerialBridge.js` (chargé avant `usbReader.js`) détecte la plateforme
et délègue au plugin Java `UsbSerialPlugin` :

```
android.hardware.usb (OS Android)
      │
UsbSerialPlugin.java  (thread dédié — SerialInputOutputManager)
      │  notifyListeners('serialData', { data: "<ligne JSON>" })
      ▼
androidSerialBridge.js
      │  JSON.parse → CustomEvent('flightdata', { detail })
      ▼
Toutes les jauges — même événement que desktop
```

Câble **USB-OTG** requis. L'OS propose d'ouvrir AeroDb au branchement du
périphérique (intent `USB_DEVICE_ATTACHED`). La permission USB est demandée
une seule fois par périphérique.

### Sketch de test — arduino/sendJson/sendJson.ino

Envoi en boucle d'une trame JSON complète sans capteur réel :
- Fréquence : 5 Hz — `SEND_INTERVAL_MS = 200` (configurable)
- Baud rate : 115 200 (idem `config.ini → BaudRate`)
- Tous les champs (`roll`, `pitch`, `heading`, `speed`, `rpm`, `cht*`, `egt*`, `fuel*`…)
- Compatible Arduino Nano/Uno et ESP32

> **Recommandation matérielle :** Arduino Nano suffisant pour envoyer du JSON.
> Pour un EFIS avec capteurs réels (IMU + GPS + pression), préférer un **ESP32**
> (WiFi natif, 520 KB RAM, dual-core 240 MHz, compatible avec le sketch actuel).

---

## Flux commun à toutes les sources

Quelle que soit la source, les jauges reçoivent les données via
`CustomEvent('flightdata')` dispatché sur `document` :

```
Source active (simulateur / WiFi / USB desktop / USB Android)
      │
      ▼
CustomEvent('flightdata', { detail: { roll, pitch, heading, speed, … } })
      │
      ├── speedGauge       → gauge.setValue(e.detail.speed)
      ├── compassGauge     → gauge.setValue(e.detail.compass)
      ├── tachimeter       → gauge.setValue(e.detail.rpm / TACH_DIVISOR)
      ├── tempWaterGauge   → gauge.setValue(e.detail.water)
      ├── tempCHTGauge     → gauge.setValue(e.detail.cht)
      ├── tempEGTGauge     → gauge.setValue(e.detail.egt)
      ├── fuelGauge        → gauge.setValue(e.detail.fuel)
      ├── variometreGauge  → gauge.setValue(e.detail.vario)
      └── addGauge.js      → setRoll / setPitch / setHeading / setAltitude / setVario
                             (flight indicators — événement flightdata direct)
```

---

## Compatibilité par plateforme

| Source | Desktop Chrome/Edge | Electron | Android APK |
|--------|---------------------|----------|-------------|
| Simulation | ✅ | ✅ | ✅ |
| WiFi | ✅ | ✅ | ✅ |
| USB | ✅ Web Serial | ✅ Web Serial | ✅ Plugin Java |

---

## Configuration USB

```ini
[USB]
BaudRate = 115200    ; doit correspondre au firmware du microcontrôleur
```

Le sketch `arduino/sendJson/sendJson.ino` utilise `BAUD_RATE 115200` par défaut.
