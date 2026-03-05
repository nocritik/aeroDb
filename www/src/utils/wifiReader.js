/*
 * Lecteur de données WiFi (WebSocket)
 *
 * Se connecte à un microcontrôleur (ESP32 / ESP8266 …) via WebSocket et reçoit
 * des trames JSON. À chaque trame reçue, dispatche un CustomEvent 'flightdata'
 * exactement comme usbReader.js — les instruments ne voient aucune différence.
 *
 * Usage console :
 *   wifiReader.connect('192.168.4.1')   // IP de l'ESP (mode Access Point par défaut)
 *   wifiReader.connect('192.168.1.42', 81)  // IP + port personnalisé
 *   wifiReader.disconnect()
 *   wifiReader.isConnected              // true si la WebSocket est ouverte
 *   wifiReader.data                     // dernières données reçues
 *
 * Format JSON attendu (même que USB, 1 objet JSON par message WebSocket) :
 *   {"roll":5.2,"pitch":-2.1,"heading":245,"altitude":1500, ...}
 *   → voir docs/usb-json-protocol.md pour la liste complète des champs
 *
 * Configuration persistante :
 *   L'IP et le port sont mémorisés dans localStorage (clés : wifi_host, wifi_port).
 *   Au chargement de la page, wifiReader tente de se reconnecter automatiquement
 *   si une IP a été enregistrée.
 */

/** IP par défaut du microcontrôleur en mode Access Point (modifiable via le panneau UI) */
var WIFI_DEFAULT_HOST = '192.168.4.1';

/** Port WebSocket par défaut */
var WIFI_DEFAULT_PORT = 81;

/** Délai entre deux tentatives de reconnexion automatique (ms) */
var WIFI_RECONNECT_DELAY = 3000;

// =============================================================================
//  CLASSE WifiFlightDataReader
// =============================================================================

/**
 * Reçoit des trames JSON depuis un microcontrôleur via WebSocket.
 * Dispatche un CustomEvent 'flightdata' à chaque trame reçue.
 */
class WifiFlightDataReader {
    constructor() {
        this._socket = null;
        this._connected = false;
        this._data = {};
        this._host = null;
        this._port = null;
        this._reconnectTimer = null;
        this._userDisconnect = false;   // true si déconnexion volontaire (pas de reconnexion)
    }

    /** @returns {boolean} Vrai si la WebSocket est ouverte et active */
    get isConnected() { return this._connected; }

    /** Dernières données de vol reçues. @returns {object} */
    get data() { return this._data; }

    /**
     * Ouvre la connexion WebSocket vers le microcontrôleur.
     * @param {string} [host] - IP ou hostname du device WiFi
     * @param {number} [port] - Port WebSocket (défaut : WIFI_DEFAULT_PORT)
     */
    connect(host, port) {
        this._host = host || WIFI_DEFAULT_HOST;
        this._port = port || WIFI_DEFAULT_PORT;
        this._userDisconnect = false;

        // Mémoriser la configuration pour l'auto-reconnexion au prochain chargement
        try {
            localStorage.setItem('wifi_host', this._host);
            localStorage.setItem('wifi_port', String(this._port));
        } catch (e) { /* localStorage indisponible */ }

        this._openSocket();
    }

    /** Ferme la connexion WebSocket et annule toute reconnexion automatique. */
    disconnect() {
        this._userDisconnect = true;
        this._cancelReconnect();
        if (this._socket) {
            this._socket.close();
            this._socket = null;
        }
        this._connected = false;
        console.info('[WiFi] Déconnecté.');
        _updateWifiPanel();
    }

    // -------------------------------------------------------------------------
    //  Gestion de la WebSocket
    // -------------------------------------------------------------------------

    /** Instancie la WebSocket et attache les handlers. */
    _openSocket() {
        var url = 'ws://' + this._host + ':' + this._port + '/';
        console.info('[WiFi] Connexion WebSocket → ' + url);

        try {
            this._socket = new WebSocket(url);
        } catch (err) {
            console.error('[WiFi] Impossible d\'ouvrir la WebSocket :', err.message);
            this._scheduleReconnect();
            return;
        }

        var self = this;

        this._socket.onopen = function () {
            self._connected = true;
            console.info('[WiFi] Connecté à ' + url);
            _updateWifiPanel();
        };

        this._socket.onmessage = function (event) {
            self._parseLine(event.data);
        };

        this._socket.onclose = function () {
            if (self._connected) {
                console.warn('[WiFi] Connexion perdue — reconnexion dans ' + WIFI_RECONNECT_DELAY / 1000 + ' s…');
            }
            self._connected = false;
            self._socket = null;
            _updateWifiPanel();
            if (!self._userDisconnect) {
                self._scheduleReconnect();
            }
        };

        this._socket.onerror = function () {
            // onclose sera appelé juste après — pas besoin d'agir ici
        };
    }

    /** Programme une tentative de reconnexion après WIFI_RECONNECT_DELAY ms. */
    _scheduleReconnect() {
        this._cancelReconnect();
        if (this._userDisconnect) return;
        var self = this;
        this._reconnectTimer = setTimeout(function () {
            console.info('[WiFi] Tentative de reconnexion → ' + self._host + ':' + self._port);
            self._openSocket();
        }, WIFI_RECONNECT_DELAY);
    }

    _cancelReconnect() {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }

    /**
     * Parse un message JSON, met à jour les données et dispatche 'flightdata'.
     * Identique à UsbFlightDataReader._parseLine.
     * @param {string} line
     */
    _parseLine(line) {
        if (!line) return;
        try {
            var parsed = JSON.parse(line.trim());
            Object.assign(this._data, parsed);
            document.dispatchEvent(new CustomEvent('flightdata', {
                detail: this._data
            }));
        } catch (e) {
            // JSON invalide ignoré
        }
    }
}

// =============================================================================
//  INSTANCE GLOBALE
// =============================================================================

var wifiReader = new WifiFlightDataReader();
window.wifiReader = wifiReader;

// =============================================================================
//  PANNEAU UI — CONFIGURATION WiFi
// =============================================================================

function _createWifiPanel() {
    if (document.getElementById('wifi-panel')) return;

    var panel = document.createElement('div');
    panel.id = 'wifi-panel';
    panel.style.cssText =
        'position:fixed;bottom:20px;left:380px;z-index:9999;' +
        'background:rgba(18,18,18,0.92);color:#ddd;' +
        'padding:8px 12px;border-radius:7px;font-size:12px;' +
        'font-family:monospace;display:flex;align-items:center;gap:8px;' +
        'border:1px solid rgba(0,140,255,0.45);box-shadow:0 2px 8px rgba(0,0,0,0.5);';

    // Vérifier le mode (prod/dev) et ajuster l'affichage initial
    try {
        const configData = localStorage.getItem('aero_config');
        if (configData) {
            const config = JSON.parse(configData);
            if (config.environment === 'prod') {
                panel.style.display = 'none';
            }
        }
    } catch (e) {
        // Ignorer les erreurs de lecture de config
    }

    // LED
    var led = document.createElement('span');
    led.id = 'wifi-led';
    led.style.cssText =
        'width:9px;height:9px;border-radius:50%;' +
        'background:#444;display:inline-block;flex-shrink:0;';

    // Libellé
    var label = document.createElement('span');
    label.id = 'wifi-label';
    label.textContent = 'WiFi';

    // Champ IP
    var inputHost = document.createElement('input');
    inputHost.id = 'wifi-host-input';
    inputHost.type = 'text';
    inputHost.placeholder = WIFI_DEFAULT_HOST;
    inputHost.value = localStorage.getItem('wifi_host') || WIFI_DEFAULT_HOST;
    inputHost.style.cssText =
        'background:#222;color:#ccc;border:1px solid #555;' +
        'border-radius:3px;font-size:11px;font-family:monospace;' +
        'padding:1px 5px;width:110px;';

    // Champ port
    var inputPort = document.createElement('input');
    inputPort.id = 'wifi-port-input';
    inputPort.type = 'number';
    inputPort.placeholder = String(WIFI_DEFAULT_PORT);
    inputPort.value = localStorage.getItem('wifi_port') || String(WIFI_DEFAULT_PORT);
    inputPort.style.cssText =
        'background:#222;color:#ccc;border:1px solid #555;' +
        'border-radius:3px;font-size:11px;font-family:monospace;' +
        'padding:1px 5px;width:48px;';

    // Bouton
    var btn = document.createElement('button');
    btn.id = 'wifi-btn';
    btn.textContent = 'Connect';
    btn.style.cssText =
        'background:#07c;color:#fff;border:none;border-radius:4px;' +
        'padding:3px 10px;cursor:pointer;font-size:12px;font-family:monospace;';

    btn.onclick = function () {
        if (wifiReader.isConnected) {
            wifiReader.disconnect();
        } else {
            var host = document.getElementById('wifi-host-input').value.trim() || WIFI_DEFAULT_HOST;
            var port = parseInt(document.getElementById('wifi-port-input').value, 10) || WIFI_DEFAULT_PORT;
            wifiReader.connect(host, port);
        }
    };

    panel.appendChild(led);
    panel.appendChild(label);
    panel.appendChild(inputHost);
    panel.appendChild(inputPort);
    panel.appendChild(btn);
    document.body.appendChild(panel);
}

function _updateWifiPanel() {
    var led = document.getElementById('wifi-led');
    var label = document.getElementById('wifi-label');
    var btn = document.getElementById('wifi-btn');
    if (!led) return;

    if (wifiReader.isConnected) {
        led.style.background = '#07f';
        led.style.boxShadow = '0 0 6px #07f';
        label.textContent = 'WiFi : ' + localStorage.getItem('wifi_host');
        btn.textContent = 'Disconnect';
        btn.style.background = '#b33';
    } else {
        led.style.background = '#444';
        led.style.boxShadow = 'none';
        label.textContent = 'WiFi';
        btn.textContent = 'Connect';
        btn.style.background = '#07c';
    }
}

// =============================================================================
//  AUTO-CONNEXION AU DÉMARRAGE
// =============================================================================

document.addEventListener('DOMContentLoaded', function () {
    _createWifiPanel();

    // Si une IP a été mémorisée lors d'une session précédente, tenter de se reconnecter
    var savedHost = localStorage.getItem('wifi_host');
    var savedPort = parseInt(localStorage.getItem('wifi_port'), 10) || WIFI_DEFAULT_PORT;
    if (savedHost) {
        console.info('[WiFi] Auto-connexion → ' + savedHost + ':' + savedPort);
        wifiReader.connect(savedHost, savedPort);
    }
});
