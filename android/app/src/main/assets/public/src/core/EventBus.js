/**
 * Bus d'événements global (pattern Singleton)
 * Permet la communication entre composants découplés via événements
 */
export class EventBus {
    /**
     * Crée une instance d'EventBus (Singleton)
     */
    constructor() {
        // Implémentation du pattern Singleton
        if (EventBus.instance) {
            return EventBus.instance;
        }

        this._events = new Map();
        EventBus.instance = this;
    }

    /**
     * S'abonne à un événement
     * @param {string} eventName - Nom de l'événement
     * @param {Function} handler - Fonction de gestion de l'événement
     * @returns {Function} Fonction pour se désabonner
     */
    on(eventName, handler) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, new Set());
        }

        this._events.get(eventName).add(handler);

        // Retourne une fonction de désabonnement
        return () => this.off(eventName, handler);
    }

    /**
     * Se désabonne d'un événement
     * @param {string} eventName - Nom de l'événement
     * @param {Function} handler - Fonction de gestion à retirer
     */
    off(eventName, handler) {
        if (this._events.has(eventName)) {
            this._events.get(eventName).delete(handler);
        }
    }

    /**
     * Émet un événement
     * @param {string} eventName - Nom de l'événement
     * @param {*} data - Données à transmettre aux handlers
     */
    emit(eventName, data) {
        if (this._events.has(eventName)) {
            this._events.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Erreur dans le handler de l'événement ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * S'abonne à un événement pour une seule émission
     * @param {string} eventName - Nom de l'événement
     * @param {Function} handler - Fonction de gestion de l'événement
     */
    once(eventName, handler) {
        const onceHandler = (data) => {
            handler(data);
            this.off(eventName, onceHandler);
        };

        this.on(eventName, onceHandler);
    }

    /**
     * Efface tous les listeners d'événements
     */
    clear() {
        this._events.clear();
    }
}

/**
 * Instance singleton exportée pour utilisation globale
 * @type {EventBus}
 */
export const eventBus = new EventBus();
