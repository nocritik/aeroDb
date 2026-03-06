/*
 * Lecteur de données USB (Web Serial API — desktop)
 * Compatible : Chrome 89+, Edge 89+
 *
 * Sur Android (Capacitor) ce fichier délègue automatiquement à
 * androidSerialBridge (androidSerialBridge.js) qui utilise le plugin
 * natif UsbSerialPlugin.java à la place de navigator.serial.
 *
 * Lit des trames JSON ligne par ligne depuis un port série USB.
 * À chaque trame reçue, dispatche un CustomEvent 'flightdata' que tous les
 * instruments écoutent pour se mettre à jour immédiatement (sans polling).
 *
 * Usage console :
 *   usbReader.connect()      // demande à l'utilisateur de choisir un port
 *   usbReader.disconnect()   // ferme la connexion
 *   usbReader.isConnected    // true si la lecture est active
 *   usbReader.data           // dernières données reçues
 *
 * Format JSON attendu (1 objet JSON par ligne) :
 *   {"roll":5.2,"pitch":-2.1,"heading":245,"altitude":1500, ...}
 *   → voir docs/usb-json-protocol.md pour la liste complète des champs
 *
 * Sources de données alternatives (même événement 'flightdata') :
 *   androidSerialBridge.js — bridge natif Android (Capacitor)
 *   usbSimulator.js        — simulateur JSON intégré
 *   wifiReader.js          — lecteur WiFi/WebSocket
 */

/** Vitesse de communication en bauds — à modifier selon le firmware du microcontrôleur */
var USB_BAUD_RATE = 9600;

// =============================================================================
//  CLASSE UsbFlightDataReader
// =============================================================================

/**
 * Lit des trames JSON ligne par ligne depuis un port USB/série.
 * Dispatche un CustomEvent 'flightdata' à chaque trame reçue.
 *
 * Sur Android Capacitor, connect() et disconnect() délèguent à
 * window.androidSerialBridge et gardent this._connected en cohérence.
 */
class UsbFlightDataReader {
    constructor() {
        this._port      = null;
        this._reader    = null;
        this._connected = false;
        this._buffer    = '';
        this._data      = {};
        this._decoder   = new TextDecoder();
    }

    /** @returns {boolean} Vrai si la lecture est active */
    get isConnected() { return this._connected; }

    /** Dernières données de vol reçues. @returns {object} */
    get data() { return this._data; }

    /**
     * Ouvre un port déjà autorisé sans geste utilisateur (auto-reconnexion).
     * Desktop uniquement — sur Android c'est le bridge qui gère la reconnexion.
     * @param {SerialPort} port
     * @param {number} [baudRate=9600]
     * @returns {Promise<boolean>}
     */
    async connectToExistingPort(port, baudRate) {
        baudRate = baudRate || 9600;
        // Sur Android ce chemin n'est jamais emprunté (_tryAutoConnect le court-circuite)
        try {
            this._port = port;
            await this._port.open({ baudRate: baudRate });
            this._connected = true;
            console.info('[USB] Auto-reconnecté à ' + baudRate + ' baud.');
            _hideConnectionBanner();
            this._startReading();
            return true;
        } catch (err) {
            console.warn('[USB] Auto-connexion échouée :', err.message);
            this._connected = false;
            this._port = null;
            return false;
        }
    }

    /**
     * Demande à l'utilisateur de choisir un port, puis démarre la lecture.
     * Sur Android Capacitor, délègue à androidSerialBridge.
     * @param {number} [baudRate=9600]
     * @returns {Promise<boolean>}
     */
    async connect(baudRate) {
        baudRate = baudRate || 9600;

        // ── Android Capacitor → plugin natif USB série ──────────────────────
        if (window.androidSerialBridge) {
            var ok = await window.androidSerialBridge.connect(baudRate);
            // Synchroniser _connected pour que les composants qui lisent
            // usbReader.isConnected obtiennent le bon état
            this._connected = ok;
            this._data = window.androidSerialBridge.data;
            return ok;
        }

        // ── Desktop Chrome / Edge → Web Serial API ──────────────────────────
        if (!('serial' in navigator)) {
            console.error('[USB] Web Serial API non supportée. Utilisez Chrome ou Edge 89+.');
            return false;
        }
        try {
            this._port = await navigator.serial.requestPort();
            await this._port.open({ baudRate: baudRate });
            this._connected = true;
            console.info('[USB] Connecté à ' + baudRate + ' baud.');
            _hideConnectionBanner();
            this._startReading();
            return true;
        } catch (err) {
            console.error('[USB] Connexion échouée :', err.message);
            this._connected = false;
            return false;
        }
    }

    /**
     * Ferme proprement la connexion.
     * Sur Android Capacitor, délègue à androidSerialBridge.
     */
    async disconnect() {
        // ── Android Capacitor ───────────────────────────────────────────────
        if (window.androidSerialBridge) {
            await window.androidSerialBridge.disconnect();
            this._connected = false;
            return;
        }

        // ── Desktop ─────────────────────────────────────────────────────────
        this._connected = false;
        try {
            if (this._reader) {
                await this._reader.cancel();
                this._reader.releaseLock();
                this._reader = null;
            }
            if (this._port) {
                await this._port.close();
                this._port = null;
            }
            console.info('[USB] Déconnecté.');
        } catch (err) {
            console.warn('[USB] Erreur déconnexion :', err.message);
        }
    }

    /** Boucle de lecture asynchrone en arrière-plan (desktop uniquement). */
    async _startReading() {
        try {
            while (this._connected && this._port.readable) {
                this._reader = this._port.readable.getReader();
                try {
                    while (true) {
                        var result = await this._reader.read();
                        if (result.done) break;
                        this._buffer += this._decoder.decode(result.value, { stream: true });
                        var lines = this._buffer.split('\n');
                        this._buffer = lines.pop();
                        for (var i = 0; i < lines.length; i++) {
                            this._parseLine(lines[i].trim());
                        }
                    }
                } finally {
                    this._reader.releaseLock();
                    this._reader = null;
                }
            }
        } catch (err) {
            if (this._connected) {
                console.error('[USB] Erreur de lecture :', err.message);
                this._connected = false;
            }
        }
    }

    /**
     * Parse une ligne JSON, met à jour les données et dispatche 'flightdata'.
     * @param {string} line
     */
    _parseLine(line) {
        if (!line) return;
        try {
            var parsed = JSON.parse(line);
            Object.assign(this._data, parsed);
            document.dispatchEvent(new CustomEvent('flightdata', {
                detail: this._data
            }));
        } catch (e) {
            // Ligne non-JSON ignorée (messages de debug du firmware, etc.)
        }
    }
}

// =============================================================================
//  INSTANCE GLOBALE
// =============================================================================

/** Instance partagée par tous les composants jauges, le simulateur et les readers alternatifs */
var usbReader = new UsbFlightDataReader();

// =============================================================================
//  BANNIÈRE DE CONNEXION
// =============================================================================

function _showConnectionBanner(message) {
    if (document.getElementById('usb-connection-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'usb-connection-banner';
    banner.style.cssText =
        'position:fixed;bottom:20px;right:20px;z-index:9999;' +
        'background:rgba(20,20,20,0.88);color:#fff;padding:10px 18px;' +
        'border-radius:6px;font-size:13px;cursor:pointer;' +
        'border:1px solid rgba(255,200,0,0.5);font-family:monospace;';
    banner.textContent = '\uD83D\uDD0C ' + message;
    document.body.appendChild(banner);
}

function _hideConnectionBanner() {
    var banner = document.getElementById('usb-connection-banner');
    if (banner) banner.remove();
}

// =============================================================================
//  AUTO-CONNEXION AU DÉMARRAGE
// =============================================================================

/**
 * Tentative d'auto-connexion au chargement de la page :
 *
 * Android Capacitor :
 *   → Délègue à androidSerialBridge.connect() ; si aucun périphérique n'est
 *     branché, une bannière invitant à brancher le câble USB-OTG est affichée.
 *
 * Desktop Chrome / Edge :
 *   → Port déjà autorisé → connexion silencieuse.
 *   → Sinon → bannière + écoute du premier clic/touche.
 */
async function _tryAutoConnect() {

    // ── Vérification config : ne pas tenter la connexion USB en mode dev
    //    ou si la source de données n'est pas 'usb'
    var baudRate = USB_BAUD_RATE;
    try {
        var storedConfig = localStorage.getItem('aero_config');
        var cfg = storedConfig ? JSON.parse(storedConfig) : { dataSource: 'simulation' };
        if (cfg.dataSource !== 'usb') {
            console.info('[USB] Auto-connexion ignorée (dataSource=' + cfg.dataSource + ')');
            return;
        }
        if (cfg.usb && cfg.usb.baudRate) {
            baudRate = cfg.usb.baudRate;
        }
    } catch (e) {
        console.warn('[USB] Impossible de lire la config, auto-connexion annulée par sécurité.', e);
        return;
    }

    // ── Android Capacitor ───────────────────────────────────────────────────
    if (window.androidSerialBridge) {
        console.info('[USB-Android] Tentative d\'auto-connexion USB…');
        await usbReader.connect(baudRate);
        return;
    }

    // ── Desktop → Web Serial API ────────────────────────────────────────────
    if (!('serial' in navigator)) {
        console.warn('[USB] Web Serial API non disponible (Chrome/Edge 89+ requis).');
        return;
    }

    var ports = await navigator.serial.getPorts();
    if (ports.length > 0) {
        var success = await usbReader.connectToExistingPort(ports[0], baudRate);
        if (success) return;
    }

    _showConnectionBanner('Cliquez n\'importe où pour connecter le périphérique USB');
    var _handler = async function () {
        document.removeEventListener('click',   _handler, true);
        document.removeEventListener('keydown', _handler, true);
        _hideConnectionBanner();
        await usbReader.connect(baudRate);
    };
    document.addEventListener('click',   _handler, true);
    document.addEventListener('keydown', _handler, true);
}

document.addEventListener('DOMContentLoaded', _tryAutoConnect);
