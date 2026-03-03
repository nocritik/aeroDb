# AeroDb

Outils d'aide à la navigation pour avions ultralégers (ULM) et aviation légère.

## 🎯 Fonctionnalités

### Instruments de vol personnalisables
- Indicateur de vitesse (airspeed)
- Température moteur (eau, CHT, EGT)
- Compas de navigation
- Altimètre
- Variomètre
- Jauge de carburant
- Compte-tours (tachymètre)

### Navigation interactive
- Carte interactive avec Leaflet.js
- Marqueurs d'aérodromes
- Zones aéronautiques
- Suivi de position en temps réel

### Système de configuration avancé ⚙️
- **Modale de configuration** : Interface intuitive accessible depuis la page d'accueil
- **Chargement automatique** de `config.ini` au premier démarrage
- **Trois sources de données** :
  - 🎮 **Simulation** : Générateur de données réalistes pour tests
  - 📡 **WiFi** : Connexion WebSocket vers ESP32/ESP8266
  - 🔌 **USB** : Liaison série avec Arduino ou autre microcontrôleur
- **Deux modes d'exécution** :
  - 🔧 **Développement** : Panneaux de debug visibles
  - 🚀 **Production** : Interface épurée pour le vol

## 🚀 Démarrage rapide

### 1. Lancer un serveur local

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

### 2. Ouvrir l'application

Naviguez vers `http://localhost:8000/index.html`

### 3. Configurer l'application

1. Cliquez sur **CONFIGURATION** dans le menu principal
2. Sélectionnez votre environnement (Dev/Prod)
3. Choisissez votre source de données (Simulation/WiFi/USB)
4. Configurez les paramètres spécifiques
5. Enregistrez

## 📋 Configuration

### Fichier config.ini

Au premier démarrage, les paramètres sont chargés depuis `config/config.ini` :

```ini
[General]
Environment = dev
DataSource = simulation

[WiFi]
Host = 192.168.4.1
Port = 81

[USB]
Port = COM3
BaudRate = 115200
```

### Modification de la configuration

- **Via l'interface** : Bouton CONFIGURATION dans le menu
- **Réinitialiser** : Effacer localStorage et recharger
  ```javascript
  localStorage.clear();
  location.reload();
  ```

## 📖 Documentation

- **[Guide de configuration](docs/configuration-guide.md)** : Guide utilisateur complet
- **[Résumé d'implémentation](docs/implementation-summary.md)** : Documentation technique
- **[Architecture MVVM](CLAUDE.md)** : Principes de développement

## 🛠️ Technologies

- **Frontend** : Vanilla JavaScript, jQuery 1.12.3, Bootstrap 3.3.6
- **Cartes** : Leaflet.js
- **Instruments** : Canvas Gauge libraries
- **Architecture** : ES6 Modules, MVVM pattern
- **Stockage** : LocalStorage + fichier INI

## 🎨 Mode Développement

En mode développement, deux panneaux sont visibles en bas de la page :

```
┌────────────────────────────────────────────┐
│        Instruments de vol                  │
└────────────────────────────────────────────┘
  ┌──────────────┐  ┌──────────────────┐
  │ Simulateur   │  │ WiFi Config      │
  │ JSON : 5 Hz  │  │ 192.168.4.1:81  │
  │ [Stop]       │  │ [Connect]        │
  └──────────────┘  └──────────────────┘
```

## 🔧 Structure du projet

```
aeroDb/
├── config/               # Configuration
│   └── config.ini       # Fichier de configuration INI
├── src/
│   ├── core/            # Classes de base (Observable, EventBus)
│   ├── models/          # Modèles de données (GaugeConfig)
│   ├── services/        # Services (ConfigService)
│   └── utils/           # Utilitaires
│       ├── jquery-1.12.3.min.js  # jQuery
│       ├── mustache.min.js       # Mustache templates
│       ├── usbReader.js          # Lecteur USB/série
│       ├── usbSimulator.js       # Simulateur de données
│       └── wifiReader.js         # Lecteur WiFi/WebSocket
├── scripts/
│   ├── configManager.js # Gestionnaire de la modale config
│   ├── event.js         # Gestion des événements
│   └── gauge/           # Composants des instruments
│       └── components/  # Jauges individuelles
├── partial/
│   ├── gauge_page.html  # Page des instruments
│   └── nav_page.html    # Page de navigation
├── docs/                # Documentation
│   ├── configuration-guide.md
│   ├── implementation-summary.md
│   └── CHANGELOG.md
└── index.html           # Page d'accueil
```

## 🤝 Contribution

Voir [CLAUDE.md](CLAUDE.md) pour les conventions de code et l'architecture.

## 📄 Licence

Projet personnel - Tous droits réservés
