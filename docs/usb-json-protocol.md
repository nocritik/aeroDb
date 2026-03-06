# Protocole USB — Format des trames JSON

## Principe général

Le microcontrôleur (Arduino, ESP32, Raspberry Pi…) envoie les données de vol
via le port USB/série sous forme de **lignes JSON** : une trame JSON complète
par ligne, terminée par un caractère saut de ligne `\n`.

```
{"roll":5.2,"pitch":-2.1,"heading":245, ...}\n
{"roll":5.5,"pitch":-2.0,"heading":246, ...}\n
```

> Côté Arduino/ESP32 : utiliser `Serial.println(jsonString)` qui ajoute
> automatiquement le `\n` en fin de ligne.

---

## Exemple de trame complète

```json
{
  "roll": 5.2,
  "pitch": -2.1,
  "heading": 245,
  "altitude": 1500,
  "pressure": 1013,
  "turnCoordinator": 0,
  "slip": 0.0,
  "variometer": 0.5,
  "compass": 245,
  "speed": 135,
  "rpm": 4500,
  "water": 82,
  "waterL": 80,
  "waterR": 84,
  "cht": 195,
  "chtL": 192,
  "chtR": 198,
  "egt": 720,
  "egtL": 715,
  "egtR": 725,
  "vario": 0.5,
  "fuelR": 45,
  "fuelL": 47,
  "fuel": 92
}
```

> En transmission série, la trame est envoyée sur **une seule ligne** (sans
> retours à la ligne internes).

---

## Description des champs

| Champ JSON       | Description                              | Unité      | Plage typique  | Instrument associé             |
|------------------|------------------------------------------|------------|----------------|--------------------------------|
| `roll`           | Roulis                                   | degrés     | −180 … +180    | Horizon artificiel             |
| `pitch`          | Tangage                                  | degrés     | −90 … +90      | Horizon artificiel             |
| `heading`        | Cap magnétique                           | degrés     | 0 … 360        | Conservateur de cap            |
| `altitude`       | Altitude barométrique                    | pieds (ft) | 0 … 15 000     | Altimètre                      |
| `pressure`       | Calage altimétrique (QNH)                | hPa        | 950 … 1 050    | Altimètre                      |
| `turnCoordinator`| Taux de virage / inclinaison de l'avion  | degrés     | −30 … +30      | Coordinateur de virage         |
| `slip`           | Dérapage latéral — bille d'inclinomètre  | normalisé  | −1 … +1        | Bille (0=centré, ±1=plein bord)|
| `variometer`     | Taux de montée/descente                  | m/s        | −2 … +2        | Variomètre (indicateur de vol) |
| `compass`        | Cap compas                               | degrés     | 0 … 365        | Compas (jauge canvas)          |
| `speed`          | Vitesse anémométrique                    | Km/h       | 0 … 300        | Anémomètre (jauge canvas)      |
| `rpm`            | Régime moteur                            | tr/min     | 0 … 9 900      | Tachymètre (jauge canvas)      |
| `water`          | Température eau moteur (globale)         | °C         | 60 … 120       | Jauge Water simple             |
| `waterL`         | Température eau cylindre gauche          | °C         | 60 … 120       | Demi-jauge Water gauche        |
| `waterR`         | Température eau cylindre droit           | °C         | 60 … 120       | Demi-jauge Water droite        |
| `cht`            | Température culasse (CHT) globale        | °C         | 0 … 300        | Jauge CHT simple               |
| `chtL`           | CHT cylindre gauche                      | °C         | 0 … 300        | Demi-jauge CHT gauche          |
| `chtR`           | CHT cylindre droit                       | °C         | 0 … 300        | Demi-jauge CHT droite          |
| `egt`            | Température échappement (EGT) globale    | °C         | 400 … 1 000    | Jauge EGT simple               |
| `egtL`           | EGT cylindre gauche                      | °C         | 400 … 1 000    | Demi-jauge EGT gauche          |
| `egtR`           | EGT cylindre droit                       | °C         | 400 … 1 000    | Demi-jauge EGT droite          |
| `vario`          | Variomètre                               | m/s        | −50 … +50      | Variomètre (jauge canvas)      |
| `fuelR`          | Niveau carburant réservoir droit         | litres     | 0 … 120        | Demi-jauge carburant droite    |
| `fuelL`          | Niveau carburant réservoir gauche        | litres     | 0 … 120        | Demi-jauge carburant gauche    |
| `fuel`           | Niveau carburant principal / total       | litres     | 0 … 120        | Jauge carburant                |

---

## Règles de transmission

- **Tous les champs sont optionnels** : seuls les champs présents dans la trame
  sont mis à jour côté navigateur. Les champs absents conservent leur dernière
  valeur connue.
- **Fréquence recommandée** : 2 à 10 Hz (toutes les 100 à 500 ms).
- **Encodage** : UTF-8.
- **Vitesse série par défaut** : 115 200 bauds (configurable dans `config.ini → BaudRate`).
- Les lignes non-JSON (messages de debug, commentaires firmware) sont ignorées
  sans provoquer d'erreur.

---

## Sketch de test intégré — arduino/sendJson/sendJson.ino

Le dépôt inclut un sketch complet qui envoie en boucle une trame JSON
couvrant **tous** les instruments, avec des valeurs sinusoïdales réalistes.
Utile pour valider l'ensemble de la chaîne (port USB → jauges) sans capteur réel.

```
Instruments couverts : roll, pitch, heading, compass, altitude, pressure,
                       turnCoordinator, slip, variometer, vario, speed, rpm,
                       water, waterL, waterR, cht, chtL, chtR,
                       egt, egtL, egtR, fuel, fuelL, fuelR
Fréquence  : 5 Hz (SEND_INTERVAL_MS = 200 ms, configurable)
Baud rate  : 115 200 (BAUD_RATE — idem config.ini)
Matériel   : Arduino Nano/Uno (CH340, ATmega16U2) ou ESP32
```

Flasher avec Arduino IDE, brancher en USB, ouvrir Chrome → cliquer la bannière.

---

## Exemple de code Arduino avec capteurs réels

```cpp
#include <ArduinoJson.h>

void loop() {
  StaticJsonDocument<256> doc;

  doc["roll"]     = imu.getRoll();
  doc["pitch"]    = imu.getPitch();
  doc["heading"]  = imu.getHeading();
  doc["altitude"] = baro.getAltitudeFt();
  doc["pressure"] = baro.getPressureHPa();
  doc["speed"]    = pitot.getSpeedKmh();
  doc["rpm"]      = tach.getRPM();
  doc["fuelL"]    = fuelL.getLiters();
  doc["fuelR"]    = fuelR.getLiters();

  serializeJson(doc, Serial);
  Serial.println(); // ajoute le \n obligatoire

  delay(200); // ~5 Hz
}
```
