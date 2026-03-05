/**
 * Constantes de l'application AeroDb
 * Centralise toutes les valeurs de configuration pour faciliter la maintenance
 */

/**
 * Types de jauges disponibles
 * @enum {string}
 */
export const GAUGE_TYPES = {
    SPEED: 'gaugeSpeed1',
    TEMP: 'gaugeTemperature',
    TEMP_LEFT: 'gaugeTemperatureL',
    TEMP_RIGHT: 'gaugeTemperatureR',
    TEMP_DOUBLE: 'gaugeTemperatureD',
    COMPASS: 'gaugeCompass',
    VARIOMETER: 'gaugeVariometer',
    ATTITUDE: 'attitude',
    TURN_COORDINATOR: 'turn_coordinator',
    HEADING: 'heading',
    ALTIMETER: 'altimeter',
    FUEL: 'gaugeFuel1',
    FUEL_LEFT: 'gaugeFuelL',
    FUEL_RIGHT: 'gaugeFuelR',
    FUEL_DOUBLE: 'gaugeFuelD'
};

/**
 * Unités de mesure disponibles
 * @enum {string}
 */
export const UNITS = {
    // Vitesse
    SPEED_KMH: 'Km/h',
    SPEED_MPH: 'Mph',

    // Température
    TEMP_C: 'C°',
    TEMP_F: 'F°',

    // Altitude
    ALTITUDE_M: 'M',
    ALTITUDE_FT: 'Ft',

    // Variomètre
    VARIO_MS: 'M/s',
    VARIO_FPM: 'Ft/Min'
};

/**
 * Positions d'affichage valides
 */
export const DISPLAY_POSITIONS = {
    VERTICAL: ['up', 'center', 'down'],
    HORIZONTAL: ['left', 'center', 'right']
};

/**
 * Préfixe pour les clés de localStorage
 * @type {string}
 */
export const STORAGE_PREFIX = 'aero_gauge_';

/**
 * Taille par défaut des jauges (pixels)
 * @type {number}
 */
export const DEFAULT_GAUGE_SIZE = 300;

/**
 * Intervalle de mise à jour des jauges (millisecondes)
 * @type {number}
 */
export const UPDATE_INTERVAL_MS = 1500;

/**
 * Configuration de la carte par défaut
 */
export const MAP_CONFIG = {
    DEFAULT_LAT: 43.7079321,
    DEFAULT_LNG: 3.864752,
    DEFAULT_ZOOM: 13,
    MAX_ZOOM: 18,

    // Mapbox configuration
    TILE_URL: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
    TILE_SIZE: 512,
    ZOOM_OFFSET: -1,
    STYLE_ID: 'mapbox/streets-v11',
    ACCESS_TOKEN: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw'
};

/**
 * Configuration des marqueurs de carte
 */
export const MARKER_CONFIG = {
    // Marqueur d'aérodrome ULM
    AERODROME: {
        iconUrl: '../img/baseIcon.png',
        iconSize: [38, 40],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76]
    },

    // Marqueur d'avion
    PLANE: {
        iconUrl: '../img/planeIcon.jpg',
        iconSize: [42, 46]
    }
};

/**
 * URLs des données
 */
export const DATA_URLS = {
    BASE_ULM: '../data/base_ulm.json'
};

/**
 * Schémas de couleurs pour les jauges
 */
export const GAUGE_COLOR_SCHEMES = {
    DEFAULT: {
        plate: '#222',
        majorTicks: '#f5f5f5',
        minorTicks: '#ddd',
        title: '#f5f5f5',
        units: '#ccc',
        numbers: '#f5f5f5',
        needle: {
            start: 'red',
            end: 'red',
            circle: {
                outerStart: 'rgba(200, 200, 200, 1)',
                outerEnd: 'rgba(200, 200, 200, 1)'
            },
            shadowUp: true,
            shadowDown: false
        },
        circle: {
            shadow: false,
            outerStart: '#333',
            outerEnd: '#111',
            middleStart: '#222',
            middleEnd: '#111',
            innerStart: '#111',
            innerEnd: '#333'
        },
        valueBox: {
            rectStart: '#222',
            rectEnd: '#333',
            background: '#babab2',
            shadow: 'rgba(0, 0, 0, 1)'
        }
    }
};

/**
 * Configuration de l'animation des jauges
 */
export const GAUGE_ANIMATION = {
    delay: 10,
    duration: 1500,
    fn: 'linear' // Options: 'linear', 'quad', 'quint', 'cycle', 'bounce', 'elastic'
};

/**
 * Noms d'événements pour le bus d'événements
 * @enum {string}
 */
export const EVENTS = {
    // Événements de jauges
    GAUGE_ADDED: 'gauge:added',
    GAUGE_UPDATED: 'gauge:updated',
    GAUGE_DELETED: 'gauge:deleted',
    GAUGE_SELECTED: 'gauge:selected',
    GAUGE_DESTROYED: 'gauge:destroyed',
    GAUGES_LOADED: 'gauges:loaded',

    // Événements de carte
    MAP_INITIALIZED: 'map:initialized',
    MAP_DESTROYED: 'map:destroyed',
    MAP_LAYER_SHOWN: 'map:layer:shown',
    MAP_LAYER_HIDDEN: 'map:layer:hidden',
    MAP_LAYER_CLEARED: 'map:layer:cleared',
    MAP_AERODROMES_LOADED: 'map:aerodromes:loaded',
    MAP_AERODROMES_ERROR: 'map:aerodromes:error'
};

/**
 * Messages d'erreur standardisés
 * @enum {string}
 */
export const ERROR_MESSAGES = {
    GAUGE_NOT_FOUND: 'Jauge introuvable',
    GAUGE_TYPE_UNKNOWN: 'Type de jauge inconnu',
    GAUGE_VALIDATION_FAILED: 'Validation de la jauge échouée',
    STORAGE_SAVE_FAILED: 'Échec de la sauvegarde',
    STORAGE_LOAD_FAILED: 'Échec du chargement',
    MAP_INIT_FAILED: 'Échec de l\'initialisation de la carte',
    AERODROMES_LOAD_FAILED: 'Échec du chargement des aérodromes'
};
