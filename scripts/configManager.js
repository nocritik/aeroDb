/**
 * Gestionnaire de la modale de configuration
 * 
 * Gère l'interface utilisateur pour configurer:
 * - Source de données (WiFi/USB/Simulation)
 * - Environnement (Dev/Prod)
 * - Paramètres WiFi
 * - Paramètres USB
 */

import { ConfigService } from '../src/services/ConfigService.js';

class ConfigManager {
    constructor() {
        this.modalId = 'configModal';
        this._initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements
     * @private
     */
    _initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this._attachModalEvents();
            this._initializeSections();
        });
    }

    /**
     * Initialise l'état des sections au chargement
     * @private
     */
    _initializeSections() {
        const wifiConfig = document.getElementById('wifiConfigSection');
        const usbConfig = document.getElementById('usbConfigSection');

        // Masquer par défaut les sections de configuration
        if (wifiConfig) wifiConfig.style.display = 'none';
        if (usbConfig) usbConfig.style.display = 'none';
    }

    /**
     * Attache les événements aux éléments de la modale
     * @private
     */
    _attachModalEvents() {
        // Bouton de sauvegarde
        const saveBtn = document.getElementById('btnSaveConfig');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this._saveConfiguration());
        }

        // Bouton de réinitialisation
        const resetBtn = document.getElementById('btnResetConfig');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this._resetConfiguration());
        }

        // Bouton de nettoyage des jauges
        const clearGaugesBtn = document.getElementById('btnClearGauges');
        if (clearGaugesBtn) {
            clearGaugesBtn.addEventListener('click', () => this._clearGauges());
        }

        // Bouton de scan USB
        const scanUSBBtn = document.getElementById('btnScanUSB');
        if (scanUSBBtn) {
            scanUSBBtn.addEventListener('click', () => this._scanUSBPorts());
        }

        // Toggle environnement
        const envToggles = document.querySelectorAll('input[name="environment"]');
        envToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                // Mettre à jour visuellement les boutons Bootstrap
                document.querySelectorAll('input[name="environment"]').forEach(r => {
                    r.closest('label')?.classList.remove('active');
                });
                e.target.closest('label')?.classList.add('active');

                this._updateEnvironmentPreview(e.target.value);
            });
        });

        // Toggle source de données
        const sourceToggles = document.querySelectorAll('input[name="dataSource"]');
        sourceToggles.forEach(toggle => {
            // Événement change sur l'input
            toggle.addEventListener('change', (e) => {
                // Mettre à jour visuellement les boutons Bootstrap
                document.querySelectorAll('input[name="dataSource"]').forEach(r => {
                    r.closest('label')?.classList.remove('active');
                });
                e.target.closest('label')?.classList.add('active');

                this._updateDataSourceUI(e.target.value);
            });

            // Événement click sur l'input (pour Bootstrap 3 data-toggle)
            toggle.addEventListener('click', (e) => {
                // Petit délai pour laisser le temps au checked de se mettre à jour
                setTimeout(() => {
                    if (e.target.checked) {
                        this._updateDataSourceUI(e.target.value);
                    }
                }, 10);
            });
        });

        // Ajouter aussi un événement sur les labels
        document.querySelectorAll('label input[name="dataSource"]').forEach(input => {
            const label = input.closest('label');
            if (label) {
                label.addEventListener('click', () => {
                    setTimeout(() => {
                        const selectedRadio = document.querySelector('input[name="dataSource"]:checked');
                        if (selectedRadio) {
                            this._updateDataSourceUI(selectedRadio.value);
                        }
                    }, 50);
                });
            }
        });

        // Quand la modale s'ouvre
        $(`#${this.modalId}`).on('show.bs.modal', () => {
            this._loadCurrentConfig();
        });

        // Quand la modale est complètement affichée
        $(`#${this.modalId}`).on('shown.bs.modal', () => {
            // S'assurer que les sections correctes sont affichées
            const selectedSource = document.querySelector('input[name="dataSource"]:checked');
            if (selectedSource) {
                console.log('[ConfigManager] Modale ouverte, source sélectionnée:', selectedSource.value);
                this._updateDataSourceUI(selectedSource.value);
            }
        });
    }

    /**
     * Charge la configuration actuelle dans la modale
     * @private
     */
    _loadCurrentConfig() {
        const config = ConfigService.getConfig();

        // Environnement - activer visuellement le bouton
        const envRadio = document.querySelector(`input[name="environment"][value="${config.environment}"]`);
        if (envRadio) {
            envRadio.checked = true;
            // Activer visuellement le label parent (Bootstrap 3)
            const parentLabel = envRadio.closest('label');
            if (parentLabel) {
                // Désactiver tous les autres labels
                document.querySelectorAll('input[name="environment"]').forEach(r => {
                    r.closest('label')?.classList.remove('active');
                });
                parentLabel.classList.add('active');
            }
        }

        // Source de données - activer visuellement le bouton
        const sourceRadio = document.querySelector(`input[name="dataSource"][value="${config.dataSource}"]`);
        if (sourceRadio) {
            sourceRadio.checked = true;
            // Activer visuellement le label parent (Bootstrap 3)
            const parentLabel = sourceRadio.closest('label');
            if (parentLabel) {
                // Désactiver tous les autres labels
                document.querySelectorAll('input[name="dataSource"]').forEach(r => {
                    r.closest('label')?.classList.remove('active');
                });
                parentLabel.classList.add('active');
            }
        }

        // WiFi
        const wifiHostInput = document.getElementById('wifiHost');
        const wifiPortInput = document.getElementById('wifiPort');
        if (wifiHostInput) wifiHostInput.value = config.wifi.host;
        if (wifiPortInput) wifiPortInput.value = config.wifi.port;

        // USB
        const usbPortInput = document.getElementById('usbPort');
        const usbBaudRateInput = document.getElementById('usbBaudRate');
        if (usbPortInput) usbPortInput.value = config.usb.port;
        if (usbBaudRateInput) usbBaudRateInput.value = config.usb.baudRate;

        // Mettre à jour l'interface - IMPORTANT pour afficher les bonnes sections
        this._updateDataSourceUI(config.dataSource);
        this._updateEnvironmentPreview(config.environment);
    }

    /**
     * Sauvegarde la configuration
     * @private
     */
    _saveConfiguration() {
        // Récupérer les valeurs du formulaire
        const environment = document.querySelector('input[name="environment"]:checked')?.value || 'dev';
        const dataSource = document.querySelector('input[name="dataSource"]:checked')?.value || 'simulation';

        const wifiHost = document.getElementById('wifiHost')?.value || '192.168.4.1';
        const wifiPort = document.getElementById('wifiPort')?.value || '81';

        const usbPort = document.getElementById('usbPort')?.value || 'COM3';
        const usbBaudRate = document.getElementById('usbBaudRate')?.value || '115200';

        // Créer l'objet de configuration
        const config = {
            environment,
            dataSource,
            wifi: {
                host: wifiHost,
                port: parseInt(wifiPort, 10)
            },
            usb: {
                port: usbPort,
                baudRate: parseInt(usbBaudRate, 10)
            }
        };

        // Sauvegarder
        if (ConfigService.saveConfig(config)) {
            // Afficher un message de succès
            this._showSuccessMessage('Configuration sauvegardée avec succès!');

            // Fermer la modale après 1 seconde
            setTimeout(() => {
                $(`#${this.modalId}`).modal('hide');

                // Recharger la page si nécessaire pour appliquer les changements
                if (this._needsReload()) {
                    location.reload();
                }
            }, 1000);
        } else {
            this._showErrorMessage('Erreur lors de la sauvegarde de la configuration');
        }
    }

    /**
     * Supprime toutes les configurations de jauges du localStorage
     * @private
     */
    _clearGauges() {
        if (!confirm('Supprimer tous les instruments ? Cette action est irréversible.')) return;

        const numericKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!isNaN(parseInt(key, 10)) && key === String(parseInt(key, 10))) {
                numericKeys.push(key);
            }
        }

        numericKeys.forEach(key => localStorage.removeItem(key));

        ConfigService.clearAllGaugesFromIni().then(() => {
            this._saveConfiguration();
        });
    }

    /**
     * Réinitialise la configuration aux valeurs par défaut
     * @private
     */
    _resetConfiguration() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration aux valeurs par défaut?')) {
            ConfigService.resetToDefaults();
            this._loadCurrentConfig();
            this._showSuccessMessage('Configuration réinitialisée!');
        }
    }

    /**
     * Met à jour l'interface selon la source de données sélectionnée
     * Affiche uniquement les champs correspondant à la source sélectionnée
     * @private
     */
    _updateDataSourceUI(source) {
        const wifiConfig = document.getElementById('wifiConfigSection');
        const usbConfig = document.getElementById('usbConfigSection');

        console.log('[ConfigManager] _updateDataSourceUI appelé avec source:', source);

        // Masquer toutes les sections par défaut
        if (wifiConfig) {
            wifiConfig.style.display = 'none';
            console.log('[ConfigManager] WiFi section cachée');
        }
        if (usbConfig) {
            usbConfig.style.display = 'none';
            console.log('[ConfigManager] USB section cachée');
        }

        // Afficher uniquement la section correspondante
        if (source === 'wifi' && wifiConfig) {
            wifiConfig.style.display = 'block';
            console.log('[ConfigManager] WiFi section affichée');
        } else if (source === 'usb' && usbConfig) {
            usbConfig.style.display = 'block';
            console.log('[ConfigManager] USB section affichée');
        }
        // Si source === 'simulation', les deux restent cachées
    }

    /**
     * Met à jour l'aperçu de l'environnement
     * @private
     */
    _updateEnvironmentPreview(env) {
        const preview = document.getElementById('environmentPreview');
        if (!preview) return;

        if (env === 'dev') {
            preview.innerHTML = `
                <div class="alert alert-info">
                    <strong>Mode Développement:</strong>
                    <ul>
                        <li>Le simulateur USB sera visible</li>
                        <li>Le panneau de configuration WiFi sera visible</li>
                        <li>Tous les outils de debug seront disponibles</li>
                    </ul>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Mode Production:</strong>
                    <ul>
                        <li>Le simulateur USB sera masqué</li>
                        <li>Le panneau de configuration WiFi sera masqué</li>
                        <li>Interface utilisateur simplifiée</li>
                    </ul>
                </div>
            `;
        }
    }

    /**
     * Détermine si un rechargement de page est nécessaire
     * @private
     */
    _needsReload() {
        // Recharger si on est sur la page gauge_page.html
        return window.location.pathname.includes('gauge_page.html');
    }

    /**
     * Affiche un message de succès
     * @private
     */
    _showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;';
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    /**
     * Affiche un message d'erreur
     * @private
     */
    _showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;';
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    /**
     * Ouvre la modale de configuration
     */
    open() {
        $(`#${this.modalId}`).modal('show');
    }

    /**
     * Ferme la modale de configuration
     */
    close() {
        $(`#${this.modalId}`).modal('hide');
    }

    /**
     * Scanne les ports USB pour détecter le dispositif envoyant du JSON
     * @private
     */
    async _scanUSBPorts() {
        const scanBtn = document.getElementById('btnScanUSB');
        const loadingBtn = document.getElementById('btnScanUSB-loading');
        const resultDiv = document.getElementById('usbScanResult');
        const baudRateSelect = document.getElementById('usbBaudRate');

        // Afficher le bouton de chargement
        if (scanBtn) scanBtn.style.display = 'none';
        if (loadingBtn) loadingBtn.style.display = 'inline-block';
        if (resultDiv) resultDiv.style.display = 'none';

        try {
            const baudRate = baudRateSelect ? parseInt(baudRateSelect.value, 10) : 115200;

            console.info('[ConfigManager] Démarrage du scan USB...');
            const result = await ConfigService.scanUSBPorts(baudRate, 3000);

            console.info('[ConfigManager] Port USB détecté:', result);

            // Afficher le résultat de succès
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h5><i class="fa fa-check-circle"></i> Dispositif détecté !</h5>
                        <p><strong>Port:</strong> ${result.portName}</p>
                        <p><strong>Débit:</strong> ${result.baudRate} baud</p>
                        <p><strong>Données reçues:</strong></p>
                        <pre style="background:#f5f5f5;padding:10px;border-radius:4px;max-height:150px;overflow:auto;">${JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                `;
                resultDiv.style.display = 'block';
            }

            // Mettre à jour automatiquement les champs
            if (baudRateSelect) {
                baudRateSelect.value = result.baudRate;
            }

            const portInput = document.getElementById('usbPort');
            if (portInput) {
                portInput.value = result.portName;
            }

            this._showSuccessMessage('Port USB détecté avec succès !');

        } catch (error) {
            console.error('[ConfigManager] Erreur scan USB:', error);

            // Afficher le résultat d'erreur
            if (resultDiv) {
                let errorMessage = error.message;
                let alertClass = 'alert-warning';
                let iconClass = 'fa-exclamation-triangle';

                // Messages personnalisés selon le type d'erreur
                if (error.message.includes('API Web Serial')) {
                    errorMessage = `
                        <strong>Navigateur non supporté</strong>
                        <p>L'API Web Serial n'est disponible que sur Chrome et Edge.</p>
                        <p>Veuillez saisir manuellement le port série ci-dessous.</p>
                    `;
                    alertClass = 'alert-danger';
                    iconClass = 'fa-times-circle';
                } else if (error.message.includes('Aucun port sélectionné')) {
                    errorMessage = `
                        <strong>Scan annulé</strong>
                        <p>Aucun port n'a été sélectionné.</p>
                    `;
                } else if (error.message.includes('Aucun dispositif')) {
                    errorMessage = `
                        <strong>Aucun dispositif détecté</strong>
                        <p>Le port sélectionné n'envoie pas de données JSON valides.</p>
                        <p>Vérifiez que:</p>
                        <ul>
                            <li>Le dispositif est bien connecté</li>
                            <li>Le bon débit est sélectionné</li>
                            <li>Le dispositif envoie bien du JSON</li>
                        </ul>
                    `;
                    alertClass = 'alert-warning';
                }

                resultDiv.innerHTML = `
                    <div class="alert ${alertClass}">
                        <h5><i class="fa ${iconClass}"></i> ${error.message.includes('API Web Serial') ? 'Erreur' : 'Attention'}</h5>
                        ${errorMessage}
                    </div>
                `;
                resultDiv.style.display = 'block';
            }

            // Afficher une notification selon le type d'erreur
            if (!error.message.includes('Aucun port sélectionné')) {
                this._showErrorMessage(error.message);
            }
        } finally {
            // Restaurer le bouton de scan
            if (scanBtn) scanBtn.style.display = 'inline-block';
            if (loadingBtn) loadingBtn.style.display = 'none';
        }
    }
}

// Instance globale
const configManager = new ConfigManager();
window.configManager = configManager;

export default configManager;
