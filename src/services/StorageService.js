/**
 * Service d'abstraction localStorage
 * Fournit une interface centralisée pour la persistance des données avec:
 * - Préfixage des clés pour éviter les collisions
 * - Validation et gestion d'erreurs
 * - Support de migration depuis le format legacy
 */
export class StorageService {
    /**
     * Crée une instance du service de stockage
     * @param {string} prefix - Préfixe pour toutes les clés (évite collisions)
     */
    constructor(prefix = 'aero_gauge_') {
        this.prefix = prefix;
    }

    /**
     * Génère une clé de stockage avec préfixe
     * @private
     * @param {string|number} id - ID de la jauge
     * @returns {string} Clé préfixée
     */
    _getKey(id) {
        return `${this.prefix}${id}`;
    }

    /**
     * Sauvegarde une configuration de jauge
     * @param {Object} config - Objet de configuration de jauge (doit avoir un id)
     * @throws {Error} Si la sauvegarde échoue ou si l'id est manquant
     */
    saveGauge(config) {
        try {
            if (!config.id && config.id !== 0) {
                throw new Error('La config de jauge doit avoir un id');
            }

            const key = this._getKey(config.id);
            const json = JSON.stringify(config);
            localStorage.setItem(key, json);
        } catch (error) {
            console.error('Échec de la sauvegarde de la jauge:', error);
            throw new Error(`Sauvegarde échouée: ${error.message}`);
        }
    }

    /**
     * Récupère une configuration de jauge par son ID
     * @param {string|number} id - ID de la jauge
     * @returns {Object|null} Configuration de la jauge ou null si non trouvée
     */
    getGauge(id) {
        try {
            const key = this._getKey(id);
            const data = localStorage.getItem(key);

            if (!data) {
                return null;
            }

            return JSON.parse(data);
        } catch (error) {
            console.error(`Échec du chargement de la jauge ${id}:`, error);
            return null;
        }
    }

    /**
     * Récupère toutes les configurations de jauges
     * @returns {Array<Object>} Tableau de configurations de jauges
     */
    getAllGauges() {
        const gauges = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key && key.startsWith(this.prefix)) {
                    const data = localStorage.getItem(key);

                    try {
                        const config = JSON.parse(data);
                        gauges.push(config);
                    } catch (parseError) {
                        console.warn(`Données corrompues dans la clé ${key}, ignorée`);
                    }
                }
            }
        } catch (error) {
            console.error('Échec du chargement des jauges:', error);
        }

        return gauges;
    }

    /**
     * Met à jour une configuration de jauge existante
     * @param {string|number} id - ID de la jauge
     * @param {Object} updates - Objet contenant les propriétés à mettre à jour
     * @returns {Object} Configuration mise à jour
     * @throws {Error} Si la jauge n'existe pas
     */
    updateGauge(id, updates) {
        const existing = this.getGauge(id);

        if (!existing) {
            throw new Error(`Jauge ${id} introuvable`);
        }

        const updated = { ...existing, ...updates, id };
        this.saveGauge(updated);

        return updated;
    }

    /**
     * Supprime une configuration de jauge
     * @param {string|number} id - ID de la jauge
     * @returns {boolean} true si supprimée, false si non trouvée
     */
    deleteGauge(id) {
        try {
            const key = this._getKey(id);

            if (localStorage.getItem(key) === null) {
                return false;
            }

            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Échec de la suppression de la jauge ${id}:`, error);
            return false;
        }
    }

    /**
     * Génère le prochain ID disponible
     * @returns {number} Prochain ID disponible
     */
    getNextId() {
        const gauges = this.getAllGauges();

        if (gauges.length === 0) {
            return 0;
        }

        // Trouve l'ID maximum et incrémente
        const maxId = gauges.reduce((max, gauge) => {
            const id = parseInt(gauge.id, 10);
            return isNaN(id) ? max : Math.max(max, id);
        }, -1);

        return maxId + 1;
    }

    /**
     * Efface toutes les données de jauges
     * @param {boolean} confirm - Paramètre de sécurité (doit être true)
     * @throws {Error} Si confirm n'est pas true
     */
    clearAll(confirm = false) {
        if (!confirm) {
            throw new Error('clearAll requiert le paramètre confirm=true');
        }

        const keys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }

        keys.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Migre les données au format legacy (clés numériques) vers le nouveau format (clés préfixées)
     * Cette fonction détecte automatiquement les anciennes données et les migre
     * @returns {number} Nombre d'éléments migrés
     */
    migrateLegacyData() {
        let migrated = 0;
        const toMigrate = [];

        // Collecter les éléments legacy
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Vérifier si c'est une clé numérique (format legacy)
            if (key && /^\d+$/.test(key)) {
                const data = localStorage.getItem(key);
                try {
                    const config = JSON.parse(data);
                    // Vérifier si ça ressemble à une config de jauge
                    if (config.instrument) {
                        toMigrate.push({ oldKey: key, data: config });
                    }
                } catch (e) {
                    // Pas du JSON, ignorer
                }
            }
        }

        // Migrer les éléments
        toMigrate.forEach(({ oldKey, data }) => {
            const newKey = this._getKey(oldKey);
            // Ajouter l'id si manquant
            if (!data.id) {
                data.id = oldKey;
            }
            localStorage.setItem(newKey, JSON.stringify(data));
            localStorage.removeItem(oldKey);
            migrated++;
        });

        if (migrated > 0) {
            console.log(`✓ Migration réussie: ${migrated} jauge(s) migrée(s) vers le nouveau format`);
        }

        return migrated;
    }

    /**
     * Vérifie si des données legacy existent
     * @returns {boolean} true si des données legacy sont présentes
     */
    hasLegacyData() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && /^\d+$/.test(key)) {
                const data = localStorage.getItem(key);
                try {
                    const config = JSON.parse(data);
                    if (config.instrument) {
                        return true;
                    }
                } catch (e) {}
            }
        }
        return false;
    }
}
