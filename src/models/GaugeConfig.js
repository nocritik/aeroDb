/**
 * Modèle de configuration de jauge avec validation
 * Supporte à la fois le format legacy (clés françaises) et moderne (clés anglaises)
 * pour assurer la compatibilité pendant la migration
 */
export class GaugeConfig {
    /**
     * Crée une configuration de jauge
     * @param {Object} data - Données de configuration (format legacy ou moderne)
     */
    constructor(data = {}) {
        // Support du format legacy ET moderne
        this.id = data.id ?? null;
        this.type = data.instrument || data.type || 'gaugeSpeed1';
        this.unit = data.unité || data.unit || 'Km/h';
        this.minValue = parseFloat(data.graduationMin || data.minValue || 0);
        this.maxValue = parseFloat(data.graduationMax || data.maxValue || 200);
        this.graduations = data.gradValue || data.graduations || [];

        // Position de l'afficheur
        this.displayPosition = {
            vertical: data.positionVerticalAfficheur || data.displayPosition?.vertical || 'down',
            horizontal: data.positionHorizontalAfficheur || data.displayPosition?.horizontal || 'center'
        };

        // Arcs de couleur (zones de sécurité)
        this.arcs = {
            yellow: {
                min: parseFloat(data.arcJauneMin || data.arcs?.yellow?.min || 0),
                max: parseFloat(data.arcJauneMax || data.arcs?.yellow?.max || 0)
            },
            green: {
                min: parseFloat(data.arcVertMin || data.arcs?.green?.min || 0),
                max: parseFloat(data.arcVertMax || data.arcs?.green?.max || 0)
            },
            red: {
                min: parseFloat(data.arcRougeMin || data.arcs?.red?.min || 0),
                max: parseFloat(data.arcRougeMax || data.arcs?.red?.max || 0)
            }
        };
    }

    /**
     * Valide la configuration
     * @throws {Error} Si la configuration est invalide
     * @returns {boolean} true si valide
     */
    validate() {
        const errors = [];

        // Validation du type
        if (!this.type) {
            errors.push('Type de jauge requis');
        }

        // Validation de la plage de valeurs
        if (this.minValue >= this.maxValue) {
            errors.push('La valeur minimale doit être inférieure à la valeur maximale');
        }

        // Validation de l'unité
        if (!this.unit) {
            errors.push('Unité requise');
        }

        // Validation des arcs de couleur
        ['yellow', 'green', 'red'].forEach(color => {
            const arc = this.arcs[color];
            if (arc.min > arc.max) {
                errors.push(`Arc ${color}: la valeur min ne peut pas être supérieure à max`);
            }
        });

        // Validation de la position d'affichage
        const validVerticalPositions = ['up', 'center', 'down'];
        const validHorizontalPositions = ['left', 'center', 'right'];

        if (!validVerticalPositions.includes(this.displayPosition.vertical)) {
            errors.push(`Position verticale invalide: ${this.displayPosition.vertical}`);
        }

        if (!validHorizontalPositions.includes(this.displayPosition.horizontal)) {
            errors.push(`Position horizontale invalide: ${this.displayPosition.horizontal}`);
        }

        if (errors.length > 0) {
            throw new Error(`Validation échouée:\n${errors.join('\n')}`);
        }

        return true;
    }

    /**
     * Convertit en format JSON legacy (pour compatibilité)
     * Utilise les noms de propriétés français pour rester compatible avec le code existant
     * @returns {Object} Configuration au format legacy
     */
    toJSON() {
        return {
            id: this.id,
            instrument: this.type,
            unité: this.unit,
            graduationMin: this.minValue,
            graduationMax: this.maxValue,
            gradValue: this.graduations,
            positionVerticalAfficheur: this.displayPosition.vertical,
            positionHorizontalAfficheur: this.displayPosition.horizontal,
            arcJauneMin: this.arcs.yellow.min,
            arcJauneMax: this.arcs.yellow.max,
            arcVertMin: this.arcs.green.min,
            arcVertMax: this.arcs.green.max,
            arcRougeMin: this.arcs.red.min,
            arcRougeMax: this.arcs.red.max
        };
    }

    /**
     * Convertit en format JSON moderne (pour future migration)
     * Utilise des noms de propriétés anglais standardisés
     * @returns {Object} Configuration au format moderne
     */
    toModernJSON() {
        return {
            id: this.id,
            type: this.type,
            unit: this.unit,
            minValue: this.minValue,
            maxValue: this.maxValue,
            graduations: this.graduations,
            displayPosition: this.displayPosition,
            arcs: this.arcs
        };
    }

    /**
     * Clone la configuration
     * @returns {GaugeConfig} Nouvelle instance avec les mêmes valeurs
     */
    clone() {
        return new GaugeConfig(this.toJSON());
    }

    /**
     * Compare deux configurations
     * @param {GaugeConfig} other - Autre configuration à comparer
     * @returns {boolean} true si les configurations sont identiques
     */
    equals(other) {
        if (!(other instanceof GaugeConfig)) {
            return false;
        }

        return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
    }

    /**
     * Retourne une représentation textuelle de la configuration
     * @returns {string} Description de la configuration
     */
    toString() {
        return `GaugeConfig(id=${this.id}, type=${this.type}, unit=${this.unit}, range=${this.minValue}-${this.maxValue})`;
    }
}
