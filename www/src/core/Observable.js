/**
 * Pattern Observable pour data binding réactif
 * Permet de créer des valeurs observables qui notifient automatiquement les listeners
 * lors de changements de valeur (pattern pub/sub)
 */
export class Observable {
    /**
     * Crée une nouvelle valeur observable
     * @param {*} initialValue - Valeur initiale de l'observable
     */
    constructor(initialValue) {
        this._value = initialValue;
        this._listeners = new Set();
    }

    /**
     * Obtient la valeur actuelle
     * @returns {*} Valeur actuelle
     */
    get value() {
        return this._value;
    }

    /**
     * Définit une nouvelle valeur et notifie les listeners si la valeur change
     * @param {*} newValue - Nouvelle valeur à définir
     */
    set value(newValue) {
        if (this._value !== newValue) {
            const oldValue = this._value;
            this._value = newValue;
            this._notify(newValue, oldValue);
        }
    }

    /**
     * S'abonne aux changements de valeur
     * @param {Function} listener - Fonction callback (newValue, oldValue) => void
     * @returns {Function} Fonction pour se désabonner
     */
    subscribe(listener) {
        this._listeners.add(listener);
        // Retourne une fonction de désabonnement
        return () => this._listeners.delete(listener);
    }

    /**
     * Notifie tous les listeners d'un changement de valeur
     * @private
     * @param {*} newValue - Nouvelle valeur
     * @param {*} oldValue - Ancienne valeur
     */
    _notify(newValue, oldValue) {
        this._listeners.forEach(listener => {
            try {
                listener(newValue, oldValue);
            } catch (error) {
                console.error('Erreur dans le listener observable:', error);
            }
        });
    }

    /**
     * Met à jour la valeur en utilisant une fonction de transformation
     * @param {Function} updater - Fonction (currentValue) => newValue
     */
    update(updater) {
        this.value = updater(this._value);
    }
}
