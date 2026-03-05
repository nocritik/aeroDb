/**
 * Script utilitaire pour forcer le rechargement de la configuration depuis config.ini
 * 
 * Usage depuis la console du navigateur :
 *   reloadConfigFromINI()
 * 
 * Cela rechargera config.ini et écrasera le contenu de localStorage
 */

import { ConfigService } from '../src/services/ConfigService.js';

/**
 * Force le rechargement de la configuration depuis config.ini
 * Utile pour réinitialiser localStorage avec le contenu du fichier
 */
async function reloadConfigFromINI() {
    try {
        console.info('[Reload] Chargement de config.ini...');

        const config = await ConfigService.loadConfigFromFile();

        if (config) {
            ConfigService.saveConfig(config);
            console.info('[Reload] ✓ Configuration rechargée depuis config.ini:', config);
            console.info('[Reload] localStorage a été mis à jour');

            // Demander si on veut recharger la page
            if (confirm('Configuration rechargée depuis config.ini.\nRecharger la page pour appliquer les changements?')) {
                location.reload();
            }
        } else {
            console.error('[Reload] ✗ Impossible de charger config.ini');
        }

    } catch (error) {
        console.error('[Reload] Erreur:', error);
    }
}

// Rendre accessible globalement
window.reloadConfigFromINI = reloadConfigFromINI;

export { reloadConfigFromINI };
