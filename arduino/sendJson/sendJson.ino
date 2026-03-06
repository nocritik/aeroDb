/*
 * sendJson.ino — Émetteur de trames JSON pour AeroDb
 *
 * Envoie en boucle une trame JSON complète sur le port série USB.
 * Chaque champ varie de façon sinusoïdale pour un rendu réaliste.
 *
 * Plages de variation :
 *   Instruments standards   →  0 à 150
 *   EGT (échappement)       →  0 à 900
 *   Carburant (fuel)        →  0 à 50
 *   Attitude (roll/pitch)   →  -30/+30 et -15/+15 (degrés)
 *   Cap (heading/compass)   →  0 à 359 (degrés)
 *   Altitude                →  500 à 2000 m
 *   Variomètre FI           →  -2 à +2 m/s
 *
 * Compatible : Arduino Uno, Nano (CH340/ATmega16U2), ESP32, ESP8266
 *
 * Connexion :
 *   Desktop  → câble USB direct → Chrome/Edge (Web Serial API)
 *   Android  → câble USB-OTG   → APK AeroDb (plugin UsbSerialPlugin)
 *
 * Configurer dans AeroDb :
 *   config.ini  →  DataSource = usb
 *   config.ini  →  BaudRate   = 115200
 */

// Requis pour l'IntelliSense VSCode (Arduino IDE l'inclut implicitement)
#include <Arduino.h>

// ---------------------------------------------------------------------------
//  Configuration
// ---------------------------------------------------------------------------

#define BAUD_RATE         115200
#define SEND_INTERVAL_MS  200     // Intervalle entre trames (ms). 400 = 2.5 Hz, 200 = 5 Hz.

// ---------------------------------------------------------------------------
//  Helpers sinusoïdaux
// ---------------------------------------------------------------------------

/**
 * Retourne une valeur flottante oscillant entre minVal et maxVal.
 * @param t          Temps courant en secondes
 * @param periodSec  Période de l'oscillation en secondes
 * @param minVal     Valeur minimale
 * @param maxVal     Valeur maximale
 * @param phase      Décalage de phase en radians (optionnel)
 */
float sineF(float t, float periodSec, float minVal, float maxVal, float phase = 0.0f) {
    float mid = (minVal + maxVal) / 2.0f;
    float amp = (maxVal - minVal) / 2.0f;
    return mid + amp * sinf(TWO_PI * t / periodSec + phase);
}

/**
 * Même chose mais retourne un entier arrondi.
 */
int sineI(float t, float periodSec, int minVal, int maxVal, float phase = 0.0f) {
    return (int)roundf(sineF(t, periodSec, (float)minVal, (float)maxVal, phase));
}

// ---------------------------------------------------------------------------
//  Setup
// ---------------------------------------------------------------------------

void setup() {
    Serial.begin(BAUD_RATE);
    // Attendre que le port série soit prêt (utile sur Leonardo/Micro)
    while (!Serial) { delay(10); }
}

// ---------------------------------------------------------------------------
//  Boucle principale
// ---------------------------------------------------------------------------

void loop() {
    float t = millis() / 1000.0f;  // temps courant en secondes

    // --- Attitude (degrés) ---
    float roll  = sineF(t,  6.0f, -30.0f,  30.0f);
    float pitch = sineF(t, 10.0f, -15.0f,  15.0f, 0.8f);

    // --- Navigation (degrés, 0–359) ---
    int heading = ((int)(t * 8.0f)) % 360;
    int compass = heading;

    // --- Altitude / pression ---
    int   altitude = sineI(t, 40.0f,  500, 2000);
    float pressure = sineF(t, 30.0f, 1008.0f, 1018.0f);

    // --- Coordinateur de virage / variomètre FI (valeurs physiques) ---
    float turnCoordinator = sineF(t,  8.0f, -20.0f, 20.0f);
    float variometer      = sineF(t, 14.0f,  -2.0f,  2.0f, 1.2f);
    // Bille d'inclinomètre : -1.0 (gauche) à +1.0 (droite), 0 = centré (vol coordonné)
    float slip            = sineF(t, 12.0f,  -1.0f,  1.0f, 2.1f);

    // --- Instruments canvas 0–150 ---
    int vario  = sineI(t, 14.0f,   0, 150, 1.2f);
    int speed  = sineI(t, 20.0f,   0, 150);
    int rpm    = sineI(t, 16.0f,   0, 150, 0.3f);

    // Températures eau (0–150)
    int water  = sineI(t, 30.0f,  60, 120);
    int waterL = sineI(t, 25.0f,  55, 115, 0.5f);
    int waterR = sineI(t, 35.0f,  65, 130, 1.0f);

    // CHT — culasse (0–150)
    int cht    = sineI(t, 40.0f,  80, 150);
    int chtL   = sineI(t, 36.0f,  75, 145, 0.7f);
    int chtR   = sineI(t, 44.0f,  85, 150, 1.4f);

    // --- EGT — échappement (0–900) ---
    int egt    = sineI(t, 50.0f, 400, 900);
    int egtL   = sineI(t, 46.0f, 380, 880, 0.6f);
    int egtR   = sineI(t, 54.0f, 420, 900, 1.2f);

    // --- Carburant (0–50) ---
    int fuel   = sineI(t, 120.0f, 10, 50);
    int fuelL  = sineI(t, 110.0f,  8, 48, 0.4f);
    int fuelR  = sineI(t, 130.0f, 12, 50, 0.8f);

    // --- Construire et envoyer la trame JSON sur une seule ligne ---
    // usbReader.js découpe les trames sur '\n' (Serial.println ajoute \r\n)

    Serial.print(F("{"));

    // Attitude
    Serial.print(F("\"roll\":")); Serial.print(roll, 1);
    Serial.print(F(",\"pitch\":")); Serial.print(pitch, 1);

    // Navigation
    Serial.print(F(",\"heading\":")); Serial.print(heading);
    Serial.print(F(",\"compass\":")); Serial.print(compass);

    // Altitude / pression
    Serial.print(F(",\"altitude\":")); Serial.print(altitude);
    Serial.print(F(",\"pressure\":")); Serial.print(pressure, 1);

    // Coordinateur / variomètre / bille flight indicator
    Serial.print(F(",\"turnCoordinator\":")); Serial.print(turnCoordinator, 1);
    Serial.print(F(",\"variometer\":")); Serial.print(variometer, 2);
    Serial.print(F(",\"slip\":")); Serial.print(slip, 2);

    // Instruments canvas
    Serial.print(F(",\"vario\":")); Serial.print(vario);
    Serial.print(F(",\"speed\":")); Serial.print(speed);
    Serial.print(F(",\"rpm\":")); Serial.print(rpm);

    // Températures eau
    Serial.print(F(",\"water\":")); Serial.print(water);
    Serial.print(F(",\"waterL\":")); Serial.print(waterL);
    Serial.print(F(",\"waterR\":")); Serial.print(waterR);

    // CHT
    Serial.print(F(",\"cht\":")); Serial.print(cht);
    Serial.print(F(",\"chtL\":")); Serial.print(chtL);
    Serial.print(F(",\"chtR\":")); Serial.print(chtR);

    // EGT
    Serial.print(F(",\"egt\":")); Serial.print(egt);
    Serial.print(F(",\"egtL\":")); Serial.print(egtL);
    Serial.print(F(",\"egtR\":")); Serial.print(egtR);

    // Carburant
    Serial.print(F(",\"fuel\":")); Serial.print(fuel);
    Serial.print(F(",\"fuelL\":")); Serial.print(fuelL);
    Serial.print(F(",\"fuelR\":")); Serial.print(fuelR);

    Serial.println(F("}"));  // \n termine la trame

    delay(SEND_INTERVAL_MS);
}
