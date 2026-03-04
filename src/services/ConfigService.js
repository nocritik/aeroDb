/**
 * Service de gestion de la configuration AeroDb
 *
 * Gère les paramètres de connexion (WiFi/USB/Simulation) et l'environnement (prod/dev)
 * Stocke la configuration dans localStorage et synchronise avec config.ini
 *
 * Usage :
 *   ConfigService.setDataSource('wifi')
 *   ConfigService.setEnvironment('dev')
 *   ConfigService.getConfig()
 */

export class ConfigService {

    static CONFIG_KEY = 'aero_config';

    /**
     * Configuration par défaut
     */
    static DEFAULT_CONFIG = {
        dataSource: 'simulation',  // 'wifi' | 'usb' | 'simulation'
        environment: 'dev',         // 'dev' | 'prod'
        wifi: {
            host: '192.168.4.1',
            port: 81
        },
        usb: {
            port: 'COM3',
            baudRate: 115200
        }
    };

    /**
     * Initialise la configuration au démarrage de l'application
     * Charge config.ini si localStorage est vide, sinon utilise localStorage
     * @returns {Promise<object>} Configuration chargée
     */
    static async initialize() {
        try {
            const stored = localStorage.getItem(this.CONFIG_KEY);

            // Si localStorage est vide, charger depuis config.ini
            if (!stored) {
                console.info('[ConfigService] localStorage vide, chargement de config.ini...');
                const config = await this.loadConfigFromFile();
                if (config) {
                    this.saveConfig(config);
                    console.info('[ConfigService] Configuration chargée depuis config.ini');
                    return config;
                }
            }

            console.info('[ConfigService] Configuration chargée depuis localStorage');
            return this.getConfig();
        } catch (e) {
            console.error('[ConfigService] Erreur initialisation:', e);
            return this.getConfig();
        }
    }

    /**
     * Charge la configuration depuis localStorage
     * @returns {object} Configuration actuelle
     */
    static getConfig() {
        try {
            const stored = localStorage.getItem(this.CONFIG_KEY);
            if (stored) {
                const config = JSON.parse(stored);
                // Merge avec config par défaut pour ajouter nouveaux champs
                return { ...this.DEFAULT_CONFIG, ...config };
            }
        } catch (e) {
            console.error('[ConfigService] Erreur lecture config:', e);
        }
        return { ...this.DEFAULT_CONFIG };
    }

    /**
     * Charge la configuration depuis le fichier config.ini via HTTP
     * @returns {Promise<object|null>} Configuration ou null si erreur
     */
    static async loadConfigFromFile() {
        try {
            // Déterminer le chemin relatif selon la page actuelle
            const currentPath = window.location.pathname;
            const configPath = currentPath.includes('/partial/')
                ? '../config/config.ini'
                : 'config/config.ini';

            const response = await fetch(configPath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const iniContent = await response.text();
            const config = this.parseINI(iniContent);

            console.info('[ConfigService] Fichier config.ini chargé avec succès');
            return config;

        } catch (e) {
            console.warn('[ConfigService] Impossible de charger config.ini:', e.message);
            console.warn('[ConfigService] Utilisation de la configuration par défaut');
            return null;
        }
    }

    /**
     * Parse le contenu d'un fichier INI
     * @param {string} iniContent - Contenu du fichier INI
     * @returns {object} Configuration parsée
     */
    static parseINI(iniContent) {
        const config = { ...this.DEFAULT_CONFIG };
        const lines = iniContent.split('\n');
        let currentSection = null;

        lines.forEach(line => {
            line = line.trim();

            // Ignorer les commentaires et lignes vides
            if (!line || line.startsWith(';') || line.startsWith('#')) return;

            // Section
            const sectionMatch = line.match(/^\[(.+)\]$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1].toLowerCase();
                return;
            }

            // Clé = Valeur
            const keyValueMatch = line.match(/^(.+?)\s*=\s*(.+)$/);
            if (keyValueMatch && currentSection) {
                const key = keyValueMatch[1].trim();
                const value = keyValueMatch[2].trim();

                switch (currentSection) {
                    case 'general':
                        if (key === 'DataSource') config.dataSource = value;
                        if (key === 'Environment') config.environment = value;
                        break;
                    case 'wifi':
                        if (key === 'Host') config.wifi.host = value;
                        if (key === 'Port') config.wifi.port = parseInt(value, 10);
                        break;
                    case 'usb':
                        if (key === 'Port') config.usb.port = value;
                        if (key === 'BaudRate') config.usb.baudRate = parseInt(value, 10);
                        break;
                }
            }
        });

        return config;
    }

    /**
     * Sauvegarde la configuration dans localStorage
     * @param {object} config - Configuration complète
     */
    static saveConfig(config) {
        try {
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
            this._dispatchConfigChange(config);
            this._syncToConfigINI(config);
            console.info('[ConfigService] Configuration sauvegardée:', config);
            return true;
        } catch (e) {
            console.error('[ConfigService] Erreur sauvegarde config:', e);
            return false;
        }
    }

    /**
     * Définit la source de données (wifi/usb/simulation)
     * @param {string} source - 'wifi' | 'usb' | 'simulation'
     */
    static setDataSource(source) {
        const config = this.getConfig();
        config.dataSource = source;
        this.saveConfig(config);
    }

    /**
     * Définit l'environnement (dev/prod)
     * @param {string} env - 'dev' | 'prod'
     */
    static setEnvironment(env) {
        const config = this.getConfig();
        config.environment = env;
        this.saveConfig(config);
    }

    /**
     * Met à jour les paramètres WiFi
     * @param {string} host - Adresse IP/hostname
     * @param {number} port - Port WebSocket
     */
    static setWifiConfig(host, port) {
        const config = this.getConfig();
        config.wifi.host = host;
        config.wifi.port = parseInt(port, 10);
        this.saveConfig(config);
    }

    /**
     * Met à jour les paramètres USB
     * @param {string} port - Port série (ex: COM3)
     * @param {number} baudRate - Débit
     */
    static setUSBConfig(port, baudRate) {
        const config = this.getConfig();
        config.usb.port = port;
        config.usb.baudRate = parseInt(baudRate, 10);
        this.saveConfig(config);
    }

    /**
     * Vérifie si on est en mode développement
     * @returns {boolean}
     */
    static isDevMode() {
        return this.getConfig().environment === 'dev';
    }

    /**
     * Vérifie si on est en mode production
     * @returns {boolean}
     */
    static isProdMode() {
        return this.getConfig().environment === 'prod';
    }

    /**
     * Récupère la source de données active
     * @returns {string} 'wifi' | 'usb' | 'simulation'
     */
    static getDataSource() {
        return this.getConfig().dataSource;
    }

    /**
     * Réinitialise la configuration aux valeurs par défaut
     */
    static resetToDefaults() {
        this.saveConfig({ ...this.DEFAULT_CONFIG });
    }

    /**
     * Dispatche un événement personnalisé quand la config change
     * @private
     */
    static _dispatchConfigChange(config) {
        document.dispatchEvent(new CustomEvent('configchange', {
            detail: config
        }));
    }

    /**
     * Synchronise la configuration avec le fichier config.ini
     * (pour l'instant juste un log, nécessite un backend pour écrire le fichier)
     * @private
     */
    static _syncToConfigINI(config) {
        const iniContent = this._generateINIContent(config);
        console.info('[ConfigService] Contenu config.ini à synchroniser:\n', iniContent);

        // TODO: Implémenter l'écriture dans config.ini via un backend
        // Pour l'instant, on peut copier manuellement ou utiliser l'API File System Access
    }

    /**
     * Génère le contenu du fichier config.ini
     * @private
     * @param {object} config
     */
    static _generateINIContent(config) {
        return `; AeroDb Configuration File
; Generated on ${new Date().toISOString()}

[General]
DataSource = ${config.dataSource}
Environment = ${config.environment}

[WiFi]
Host = ${config.wifi.host}
Port = ${config.wifi.port}

[USB]
Port = ${config.usb.port}
BaudRate = ${config.usb.baudRate}
`;
    }

    /**
     * Scanne les ports USB pour détecter le dispositif envoyant du JSON
     * Utilise l'API Web Serial (Chrome/Edge uniquement)
     * @param {number} baudRate - Débit à tester (par défaut 115200)
     * @param {number} timeout - Timeout en ms (par défaut 3000)
     * @returns {Promise<object>} Informations sur le port détecté
     */
    static async scanUSBPorts(baudRate = 115200, timeout = 3000) {
        // Vérifier si l'API Web Serial est disponible
        if (!('serial' in navigator)) {
            throw new Error('L\'API Web Serial n\'est pas supportée par ce navigateur. Utilisez Chrome ou Edge.');
        }

        try {
            // Demander à l'utilisateur de sélectionner un port
            const port = await navigator.serial.requestPort();

            console.info('[ConfigService] Port sélectionné, test en cours...');

            // Tester le port avec différents débits si celui spécifié échoue
            const baudRates = [baudRate, 115200, 9600, 19200, 38400, 57600];
            const uniqueBaudRates = [...new Set(baudRates)];

            for (const rate of uniqueBaudRates) {
                try {
                    const result = await this._testPort(port, rate, timeout);
                    if (result.isValid) {
                        console.info(`[ConfigService] Port valide trouvé avec baudRate ${rate}`);
                        return result;
                    }
                } catch (e) {
                    console.warn(`[ConfigService] Échec test avec baudRate ${rate}:`, e.message);
                }
            }

            throw new Error('Aucun dispositif envoyant du JSON détecté sur ce port');

        } catch (e) {
            if (e.name === 'NotFoundError') {
                throw new Error('Aucun port sélectionné');
            }
            throw e;
        }
    }

    /**
     * Teste un port série pour vérifier s'il envoie du JSON valide
     * @private
     * @param {SerialPort} port - Port à tester
     * @param {number} baudRate - Débit
     * @param {number} timeout - Timeout en ms
     * @returns {Promise<object>} Résultat du test
     */
    static async _testPort(port, baudRate, timeout) {
        let reader = null;
        let isOpen = false;

        try {
            // Ouvrir le port
            await port.open({
                baudRate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            });
            isOpen = true;

            console.info(`[ConfigService] Port ouvert avec baudRate ${baudRate}`);

            // Lire les données avec timeout
            const portInfo = port.getInfo();
            const result = await Promise.race([
                this._readJSONFromPort(port),
                this._timeout(timeout)
            ]);

            if (result.timeout) {
                throw new Error('Timeout - aucune donnée reçue');
            }

            // Port valide trouvé
            return {
                isValid: true,
                baudRate,
                portInfo,
                portName: this._getPortName(portInfo),
                data: result.data,
                message: 'Dispositif JSON détecté'
            };

        } catch (e) {
            return {
                isValid: false,
                baudRate,
                error: e.message
            };
        } finally {
            // Fermer le reader et le port
            try {
                if (reader) {
                    await reader.cancel();
                    reader.releaseLock();
                }
                if (isOpen) {
                    await port.close();
                }
            } catch (e) {
                console.warn('[ConfigService] Erreur fermeture port:', e);
            }
        }
    }

    /**
     * Lit les données du port et vérifie si c'est du JSON valide
     * @private
     * @param {SerialPort} port - Port série
     * @returns {Promise<object>} Données JSON reçues
     */
    static async _readJSONFromPort(port) {
        const reader = port.readable.getReader();
        let buffer = '';
        let jsonReceived = false;
        let parsedData = null;

        try {
            while (!jsonReceived) {
                const { value, done } = await reader.read();

                if (done) {
                    throw new Error('Port fermé avant réception de données');
                }

                // Convertir Uint8Array en string
                const chunk = new TextDecoder().decode(value);
                buffer += chunk;

                // Chercher un objet JSON complet
                const lines = buffer.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                        try {
                            parsedData = JSON.parse(trimmed);
                            jsonReceived = true;
                            console.info('[ConfigService] JSON valide reçu:', parsedData);
                            break;
                        } catch (e) {
                            // Ce n'est pas du JSON valide, continuer
                        }
                    }
                }

                // Limiter la taille du buffer
                if (buffer.length > 10000) {
                    buffer = buffer.slice(-1000);
                }
            }

            return { data: parsedData, timeout: false };

        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Crée une promesse de timeout
     * @private
     * @param {number} ms - Timeout en millisecondes
     * @returns {Promise<object>}
     */
    static _timeout(ms) {
        return new Promise(resolve => {
            setTimeout(() => resolve({ timeout: true }), ms);
        });
    }

    /**
     * Extrait un nom lisible du port
     * @private
     * @param {object} portInfo - Informations du port
     * @returns {string} Nom du port
     */
    static _getPortName(portInfo) {
        // Sous Windows, on ne peut pas facilement obtenir le nom COM
        // On utilise les infos USB disponibles
        if (portInfo.usbVendorId && portInfo.usbProductId) {
            return `USB Device (VID:${portInfo.usbVendorId.toString(16).toUpperCase()} PID:${portInfo.usbProductId.toString(16).toUpperCase()})`;
        }
        return 'Port série détecté';
    }

    /**
     * Obtient la liste des ports déjà autorisés
     * @returns {Promise<Array>} Liste des ports
     */
    static async getAuthorizedPorts() {
        if (!('serial' in navigator)) {
            return [];
        }

        try {
            const ports = await navigator.serial.getPorts();
            return ports.map(port => {
                const info = port.getInfo();
                return {
                    port,
                    info,
                    name: this._getPortName(info)
                };
            });
        } catch (e) {
            console.error('[ConfigService] Erreur récupération ports autorisés:', e);
            return [];
        }
    }
}

// Rendre accessible globalement pour compatibilité avec code existant
window.ConfigService = ConfigService;
