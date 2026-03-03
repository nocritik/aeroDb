/**
 * Simulateur de trame JSON — "bouchon" USB
 *
 * Génère des trames JSON réalistes (valeurs sinusoïdales + bruit) et les
 * dispatche via l'événement 'flightdata', exactement comme le ferait le
 * vrai port USB (UsbFlightDataReader._parseLine).
 *
 * Patch usbReader._connected = true afin que les jauges utilisent le
 * chemin événement plutôt que leur polling setInterval de secours.
 *
 * Usage console :
 *   jsonSimulator.start()      // démarre à 5 Hz
 *   jsonSimulator.start(10)    // démarre à 10 Hz
 *   jsonSimulator.stop()       // arrête
 *   jsonSimulator.toggle()     // bascule
 */
class JsonSimulator {

    constructor() {
        this._running = false;
        this._intervalId = null;
        this._hz = 5;
    }

    get isRunning() { return this._running; }

    // -------------------------------------------------------------------------
    //  Génération des trames
    // -------------------------------------------------------------------------

    /**
     * Retourne une trame JSON complète avec des valeurs réalistes.
     * Toutes les variables évoluent de façon sinusoïdale + petit bruit aléatoire
     * pour simuler un vol en palier avec légères turbulences.
     */
    _generateFrame() {
        var t = Date.now() / 1000;

        /** Petit bruit centré sur 0, amplitude ±amp */
        var noise = function (amp) { return amp * (Math.random() - 0.5) * 0.4; };

        return {
            // --- Attitude ---
            roll: Math.round((30 * Math.sin(t / 3) + noise(4)) * 10) / 10,
            pitch: Math.round((15 * Math.sin(t / 5) + noise(2)) * 10) / 10,

            // --- Navigation ---
            heading: Math.round(((t * 8) % 360 + 360) % 360),
            compass: Math.round(((t * 8) % 360 + 360) % 360),

            // --- Altitude / pression ---
            altitude: Math.round(1500 + 500 * Math.sin(t / 20) + noise(30)),
            pressure: Math.round((1013 + 5 * Math.sin(t / 30) + noise(1)) * 10) / 10,

            // --- Vol ---
            turnCoordinator: Math.round((20 * Math.sin(t / 4) + noise(3)) * 10) / 10,
            variometer: Math.round((1.5 * Math.sin(t / 7) + noise(0.3)) * 10) / 10,
            vario: Math.round((30 * Math.sin(t / 7) + noise(5)) * 10) / 10,

            // --- Vitesse / régime moteur ---
            speed: Math.round(130 + 20 * Math.sin(t / 10) + noise(5)),
            rpm: Math.round(4500 + 1000 * Math.sin(t / 8) + noise(100)),

            // --- Températures eau ---
            water: Math.round((80 + 10 * Math.sin(t / 15) + noise(2)) * 10) / 10,
            waterL: Math.round((78 + 8 * Math.sin(t / 12) + noise(2)) * 10) / 10,
            waterR: Math.round((82 + 12 * Math.sin(t / 17) + noise(2)) * 10) / 10,

            // --- CHT (culasse) ---
            cht: Math.round(200 + 30 * Math.sin(t / 20) + noise(8)),
            chtL: Math.round(195 + 25 * Math.sin(t / 18) + noise(6)),
            chtR: Math.round(205 + 35 * Math.sin(t / 22) + noise(10)),

            // --- EGT (échappement) ---
            egt: Math.round(720 + 50 * Math.sin(t / 25) + noise(15)),
            egtL: Math.round(710 + 40 * Math.sin(t / 23) + noise(12)),
            egtR: Math.round(730 + 60 * Math.sin(t / 27) + noise(18)),

            // --- Carburant ---
            fuel: Math.round((92 + 10 * Math.sin(t / 58)) * 10) / 10,
            fuelL: Math.round((47 + 5 * Math.sin(t / 55)) * 10) / 10,
            fuelR: Math.round((45 + 5 * Math.sin(t / 60)) * 10) / 10
        };
    }

    // -------------------------------------------------------------------------
    //  Contrôle
    // -------------------------------------------------------------------------

    /**
     * Démarre le simulateur.
     * @param {number} [hz=5] - Fréquence d'envoi des trames (2–20 Hz recommandé)
     */
    start(hz) {
        if (hz) this._hz = hz;
        if (this._running) this.stop();   // redémarrage propre si déjà actif

        this._running = true;

        // Patcher usbReader : les jauges arrêtent leur polling setInterval
        if (typeof usbReader !== 'undefined') {
            usbReader._connected = true;
        }

        var self = this;
        var intervalMs = Math.round(1000 / this._hz);

        this._intervalId = setInterval(function () {
            var frame = self._generateFrame();

            // Synchroniser les données de usbReader (cohérence avec usbReader.data)
            if (typeof usbReader !== 'undefined') {
                Object.assign(usbReader._data, frame);
            }

            // Dispatcher l'événement — même chemin que le vrai USB
            document.dispatchEvent(new CustomEvent('flightdata', { detail: frame }));

        }, intervalMs);

        this._updateUI();
        console.info('[SIMULATOR] Démarré à ' + this._hz + ' Hz (intervalle : ' + intervalMs + ' ms)');
    }

    /** Arrête le simulateur. */
    stop() {
        if (!this._running) return;
        this._running = false;
        clearInterval(this._intervalId);
        this._intervalId = null;

        if (typeof usbReader !== 'undefined') {
            usbReader._connected = false;
        }

        this._updateUI();
        console.info('[SIMULATOR] Arrêté');
    }

    /** Bascule start / stop. */
    toggle() {
        if (this._running) this.stop();
        else this.start();
    }

    // -------------------------------------------------------------------------
    //  Interface utilisateur (panneau flottant)
    // -------------------------------------------------------------------------

    _createUI() {
        if (document.getElementById('json-simulator-panel')) return;

        var panel = document.createElement('div');
        panel.id = 'json-simulator-panel';
        panel.style.cssText =
            'position:fixed;bottom:20px;left:20px;z-index:9999;' +
            'background:rgba(18,18,18,0.92);color:#ddd;' +
            'padding:8px 14px;border-radius:7px;font-size:12px;' +
            'font-family:monospace;display:flex;align-items:center;gap:10px;' +
            'border:1px solid rgba(0,180,90,0.45);box-shadow:0 2px 8px rgba(0,0,0,0.5);';

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

        // Voyant LED
        var led = document.createElement('span');
        led.id = 'sim-led';
        led.style.cssText =
            'width:9px;height:9px;border-radius:50%;' +
            'background:#444;display:inline-block;flex-shrink:0;';

        // Libellé
        var label = document.createElement('span');
        label.id = 'sim-label';
        label.textContent = 'Sim JSON : OFF';

        // Sélecteur de fréquence
        var select = document.createElement('select');
        select.id = 'sim-hz-select';
        select.style.cssText =
            'background:#222;color:#ccc;border:1px solid #555;' +
            'border-radius:3px;font-size:11px;font-family:monospace;padding:1px 4px;cursor:pointer;';
        [2, 5, 10, 20].forEach(function (hz) {
            var opt = document.createElement('option');
            opt.value = hz;
            opt.textContent = hz + ' Hz';
            if (hz === 5) opt.selected = true;
            select.appendChild(opt);
        });

        // Bouton Start / Stop
        var btn = document.createElement('button');
        btn.id = 'sim-btn';
        btn.textContent = 'Start';
        btn.style.cssText =
            'background:#1a6;color:#fff;border:none;border-radius:4px;' +
            'padding:3px 12px;cursor:pointer;font-size:12px;font-family:monospace;';

        var self = this;
        btn.onclick = function () {
            var hz = parseInt(document.getElementById('sim-hz-select').value, 10);
            if (self._running) { self.stop(); }
            else { self.start(hz); }
        };

        panel.appendChild(led);
        panel.appendChild(label);
        panel.appendChild(select);
        panel.appendChild(btn);
        document.body.appendChild(panel);
    }

    _updateUI() {
        var led = document.getElementById('sim-led');
        var label = document.getElementById('sim-label');
        var btn = document.getElementById('sim-btn');
        if (!led) return;

        if (this._running) {
            led.style.background = '#0f0';
            led.style.boxShadow = '0 0 6px #0f0';
            label.textContent = 'Sim JSON : ' + this._hz + ' Hz';
            btn.textContent = 'Stop';
            btn.style.background = '#b33';
        } else {
            led.style.background = '#444';
            led.style.boxShadow = 'none';
            label.textContent = 'Sim JSON : OFF';
            btn.textContent = 'Start';
            btn.style.background = '#1a6';
        }
    }
}

// Instance globale — accessible depuis la console : jsonSimulator.start() / .stop()
var jsonSimulator = new JsonSimulator();
window.jsonSimulator = jsonSimulator;

// Créer le panneau UI dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', function () {
    jsonSimulator._createUI();
});
