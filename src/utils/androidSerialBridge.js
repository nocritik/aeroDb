/*
 * Android Serial Bridge — adaptateur Capacitor USB série
 *
 * Ce fichier ne s'active QUE sur Android (détection via window.Capacitor).
 * Sur desktop (Electron, Chrome…) il ne fait rien — usbReader.js continue
 * d'utiliser l'API Web Serial native.
 *
 * Rôle :
 *   - Enveloppe le plugin natif Capacitor "UsbSerial" (UsbSerialPlugin.java)
 *     dans une interface identique à celle de UsbFlightDataReader (usbReader.js).
 *   - Dispatche le même CustomEvent 'flightdata' — les jauges n'ont aucun
 *     changement à subir.
 *   - Expose window.androidSerialBridge que usbReader.js consulte pour
 *     déléguer connect() / disconnect() sur Android.
 *
 * Événements reçus du plugin natif :
 *   "serialData"  { data: "<ligne JSON>" }             — une trame reçue
 *   "serialState" { connected: bool, error?: string }  — changement d'état
 *
 * Usage console (Android uniquement) :
 *   androidSerialBridge.connect()      // connecte au premier port USB trouvé
 *   androidSerialBridge.disconnect()   // ferme la connexion
 *   androidSerialBridge.isConnected    // true si actif
 *   androidSerialBridge.data           // dernières données reçues
 */

// =============================================================================
//  Détection de l'environnement Android / Capacitor
// =============================================================================

var _IS_ANDROID_CAPACITOR = !!(
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
);

if (!_IS_ANDROID_CAPACITOR) {
    // Hors Android : ne rien faire — usbReader.js gère seul la Web Serial API
    console.info('[USB-Android] Environnement non-Android détecté — bridge inactif.');
}

// =============================================================================
//  Classe AndroidSerialBridge
// =============================================================================

/**
 * Fournit la même interface publique que UsbFlightDataReader mais
 * s'appuie sur le plugin Capacitor UsbSerial au lieu de navigator.serial.
 */
class AndroidSerialBridge {
    constructor() {
        this._connected  = false;
        this._data       = {};
        this._listeners  = [];  // handles Capacitor pour pouvoir les supprimer au close()
    }

    /** @returns {boolean} Vrai si le port est ouvert et la lecture active */
    get isConnected() { return this._connected; }

    /** Dernières données de vol reçues. @returns {object} */
    get data() { return this._data; }

    // -------------------------------------------------------------------------
    //  API publique
    // -------------------------------------------------------------------------

    /**
     * Liste les périphériques USB série disponibles.
     * @returns {Promise<Array>} Tableau de descripteurs de ports
     */
    async getPorts() {
        var plugin = window.Capacitor.Plugins.UsbSerial;
        var result = await plugin.getPorts();
        return result.ports || [];
    }

    /**
     * Ouvre la connexion USB série et démarre la réception de trames.
     * Si plusieurs périphériques sont connectés, prend le premier de la liste.
     * @param {number} [baudRate=9600]
     * @returns {Promise<boolean>} true si la connexion a réussi
     */
    async connect(baudRate) {
        baudRate = baudRate || 9600;
        var plugin = window.Capacitor.Plugins.UsbSerial;

        // Supprimer les anciens listeners (reconnexion propre)
        await this._removeListeners();

        // Vérifier qu'au moins un périphérique est disponible
        var ports;
        try {
            ports = await this.getPorts();
        } catch (e) {
            console.error('[USB-Android] getPorts() échoué :', e.message);
            return false;
        }

        if (ports.length === 0) {
            console.warn('[USB-Android] Aucun périphérique USB série détecté. ' +
                         'Branchez le périphérique via un câble USB-OTG.');
            return false;
        }

        // Écouter les données ligne par ligne
        var dataHandle = await plugin.addListener('serialData', function (event) {
            _self._parseLine(event.data);
        });
        this._listeners.push(dataHandle);

        // Écouter les changements d'état (déconnexion, erreur)
        var _self = this;
        var stateHandle = await plugin.addListener('serialState', function (event) {
            _self._connected = !!event.connected;
            if (!event.connected) {
                var msg = event.error ? ' Erreur : ' + event.error : '';
                console.warn('[USB-Android] Connexion perdue.' + msg);
                _updateUsbBanner(false);
            }
        });
        this._listeners.push(stateHandle);

        // Ouvrir le port (le plugin demandera la permission Android si nécessaire)
        try {
            await plugin.open({ deviceId: ports[0].deviceId, baudRate: baudRate });
            this._connected = true;
            console.info('[USB-Android] Connecté à ' + baudRate + ' baud ' +
                         '(' + ports[0].driverName + ' — ' + ports[0].deviceName + ').');
            _updateUsbBanner(true);
            return true;
        } catch (err) {
            console.error('[USB-Android] Connexion échouée :', err.message || err);
            await this._removeListeners();
            return false;
        }
    }

    /**
     * Ferme la connexion USB série.
     */
    async disconnect() {
        var plugin = window.Capacitor.Plugins.UsbSerial;
        await this._removeListeners();
        try {
            await plugin.close();
        } catch (e) {
            console.warn('[USB-Android] Erreur lors de la fermeture :', e.message);
        }
        this._connected = false;
        _updateUsbBanner(false);
        console.info('[USB-Android] Déconnecté.');
    }

    // -------------------------------------------------------------------------
    //  Interne
    // -------------------------------------------------------------------------

    /**
     * Parse une ligne JSON reçue du port série et dispatche 'flightdata'.
     * Identique à UsbFlightDataReader._parseLine — les jauges sont aveugles
     * à la source de données.
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
            // Ligne non-JSON ignorée (messages debug firmware, etc.)
        }
    }

    /** Supprime tous les listeners Capacitor enregistrés. */
    async _removeListeners() {
        for (var i = 0; i < this._listeners.length; i++) {
            try { await this._listeners[i].remove(); } catch (e) { /* ignoré */ }
        }
        this._listeners = [];
    }
}

// =============================================================================
//  Bannière USB — mise à jour de l'indicateur existant dans usbReader.js
// =============================================================================

/**
 * Met à jour la bannière de connexion USB déjà gérée par usbReader.js.
 * Si la bannière n'existe pas encore, ne fait rien (usbReader la crée
 * au besoin).
 * @param {boolean} connected
 */
function _updateUsbBanner(connected) {
    var banner = document.getElementById('usb-connection-banner');
    if (connected) {
        if (banner) banner.remove();
    } else {
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'usb-connection-banner';
            banner.style.cssText =
                'position:fixed;bottom:20px;right:20px;z-index:9999;' +
                'background:rgba(20,20,20,0.88);color:#fff;padding:10px 18px;' +
                'border-radius:6px;font-size:13px;cursor:pointer;' +
                'border:1px solid rgba(255,200,0,0.5);font-family:monospace;';
            banner.textContent = '\uD83D\uDD0C Branchez le périphérique USB puis touchez ici';
            banner.addEventListener('click', function () {
                if (window.androidSerialBridge) {
                    window.androidSerialBridge.connect();
                }
            });
            document.body.appendChild(banner);
        }
    }
}

// =============================================================================
//  Instance globale (uniquement sur Android)
// =============================================================================

var androidSerialBridge = null;

if (_IS_ANDROID_CAPACITOR) {
    androidSerialBridge = new AndroidSerialBridge();
    window.androidSerialBridge = androidSerialBridge;
    console.info('[USB-Android] Bridge Capacitor UsbSerial initialisé.');
}
