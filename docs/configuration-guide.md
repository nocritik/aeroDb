# Guide de Configuration AeroDb

## Vue d'ensemble

AeroDb dispose maintenant d'un système de configuration centralisé permettant de gérer:
- La source de données (WiFi, USB, Simulation)
- L'environnement d'exécution (Développement, Production)
- Les paramètres de connexion WiFi et USB

## Accès à la configuration

### Via l'interface web

1. Ouvrez l'application AeroDb (`index.html`)
2. Cliquez sur le bouton **CONFIGURATION** dans le menu principal
3. Une modale s'ouvre avec tous les paramètres

### Paramètres disponibles

#### 1. Environnement

- **Développement** : Mode pour les tests et le débug
  - Affiche le simulateur JSON (panneau en bas à gauche)
  - Affiche le panneau de configuration WiFi (en haut à droite)
  - Tous les outils de développement sont visibles
  
- **Production** : Mode pour l'utilisation en vol
  - Interface utilisateur épurée
  - Masque le simulateur et le panneau WiFi
  - Démarre automatiquement avec la source configurée

#### 2. Source de données

- **Simulation** : Utilise le simulateur JSON intégré
  - Génère des données de vol réalistes
  - Parfait pour les tests sans matériel
  - Fréquence configurable (2-20 Hz)

- **WiFi** : Connexion WebSocket vers un microcontrôleur
  - ESP32 ou ESP8266 recommandés
  - Nécessite la configuration de l'IP et du port
  - Point d'accès par défaut : `192.168.4.1:81`

- **USB** : Connexion série USB
  - Port série configurable (COM3, /dev/ttyUSB0, etc.)
  - Débit configurable (9600-115200 baud)

#### 3. Configuration WiFi

Paramètres visibles uniquement si WiFi est sélectionné :

- **Adresse IP / Hostname** : Adresse du microcontrôleur
  - Mode Access Point : `192.168.4.1`
  - Mode Station : IP de votre réseau local
  
- **Port WebSocket** : Port de communication (défaut : 81)

#### 4. Configuration USB

Paramètres visibles uniquement si USB est sélectionné :

- **Port série** 
  - Windows : `COM3`, `COM4`, etc.
  - Linux : `/dev/ttyUSB0`, `/dev/ttyACM0`
  - Mac : `/dev/cu.usbserial`

- **Débit** : Vitesse de transmission
  - Valeurs courantes : 9600, 19200, 38400, 57600, 115200

##### Scan automatique des ports USB

**🔍 Nouvelle fonctionnalité** : AeroDb peut maintenant scanner automatiquement les ports USB pour détecter le dispositif qui envoie du JSON.

**Comment ça marche** :

1. Cliquez sur le bouton **Scanner les ports USB**
2. Une fenêtre s'ouvre pour sélectionner un port série
3. Le système teste automatiquement différents débits (115200, 9600, 19200, 38400, 57600)
4. Si du JSON valide est détecté, le port et le débit sont automatiquement configurés
5. Un aperçu des données JSON reçues est affiché

**Exemple de résultat** :

```
✓ Dispositif détecté !
Port: USB Device (VID:1A86 PID:7523)
Débit: 115200 baud
Données reçues:
{
  "speed": 85,
  "altitude": 1250,
  "temperature": 18,
  "compass": 270
}
```

**Compatibilité navigateur** :
- ✅ Chrome 89+
- ✅ Edge 89+
- ❌ Firefox (pas encore supporté)
- ❌ Safari (pas encore supporté)

**Limitations** :
- L'API Web Serial nécessite HTTPS en production (ou localhost en développement)
- L'utilisateur doit autoriser l'accès au port
- Le dispositif doit envoyer du JSON valide (ligne complète se terminant par `\n`)

**En cas d'échec** :
Si le scan ne détecte pas le dispositif :
- Vérifiez que le dispositif est bien connecté
- Essayez manuellement différents débits
- Vérifiez que le dispositif envoie bien du JSON
- Utilisez un outil comme PuTTY ou Arduino Serial Monitor pour vérifier les données

## Sauvegarde et application

1. Configurez les paramètres souhaités dans la modale
2. Cliquez sur **Enregistrer** (bouton vert)
3. Un message de confirmation apparaît
4. La page se recharge automatiquement si nécessaire

## Réinitialisation

Pour revenir aux paramètres par défaut :

1. Ouvrez la modale de configuration
2. Cliquez sur **Réinitialiser** (bouton orange)
3. Confirmez l'action

Paramètres par défaut :
- Environnement : Développement
- Source : Simulation
- WiFi : 192.168.4.1:81
- USB : COM3 à 115200 baud

## Stockage de la configuration

La configuration est sauvegardée à deux endroits :

1. **localStorage** (navigateur)
   - Chargement automatique au démarrage
   - Persiste entre les sessions
   - Clé : `aero_config`

2. **config.ini** (fichier)
   - Fichier source au premier démarrage
   - Chargé automatiquement si localStorage est vide
   - Format INI standard
   - Génération automatique du contenu (affiché dans la console)

### Ordre de chargement au démarrage

1. **Premier lancement** (localStorage vide) :
   ```
   Application démarre → Charge config.ini → Sauvegarde dans localStorage → Utilise la config
   ```

2. **Lancements suivants** (localStorage existe) :
   ```
   Application démarre → Lit localStorage → Utilise la config
   ```

3. **Forcer le rechargement depuis config.ini** :
   ```javascript
   // Dans la console du navigateur
   localStorage.clear();
   location.reload();
   ```

## Mode Développement vs Production

### Mode Développement

**Utilisation** : Tests, développement, débug

**Caractéristiques** :
- Simulateur JSON visible et contrôlable
- Panneau WiFi avec champs IP et port
- Console de débogage
- Possibilité de changer la source à chaud

**Disposition des panneaux** (en bas de la page) :

```
┌────────────────────────────────────────────────┐
│                                                │
│           Instruments de vol                   │
│                                                │
└────────────────────────────────────────────────┘
  ┌──────────────┐  ┌────────────────────────┐
  │ Simulateur   │  │ Configuration WiFi     │
  │ JSON : 5 Hz  │  │ 192.168.4.1:81        │
  │ [Stop]       │  │ [Connect]              │
  └──────────────┘  └────────────────────────┘
```

**Panneau Simulateur** (bas gauche) :
- LED d'état (vert = actif)
- Sélecteur de fréquence (2-20 Hz)
- Bouton Start/Stop

**Panneau WiFi** (bas gauche, à côté du simulateur) :
- LED de connexion (bleu = connecté)
- Champs IP et port
- Bouton Connect/Disconnect

### Mode Production

**Utilisation** : Vol réel, démonstrations

**Caractéristiques** :
- Interface épurée
- Source de données configurée au démarrage
- Pas de panneaux flottants
- Reconnexion automatique

## Utilisation pratique

### Scénario 1 : Tests en développement

```
1. Environnement : Développement
2. Source : Simulation
3. Enregistrer
4. → Le simulateur démarre automatiquement
5. → Vous pouvez ajuster la fréquence
```

### Scénario 2 : Vol avec ESP32 en WiFi

```
1. Environnement : Production
2. Source : WiFi
3. IP : 192.168.4.1 (ou votre IP)
4. Port : 81
5. Enregistrer
6. → L'application se connecte automatiquement
7. → Interface épurée sans panneaux
```

### Scénario 3 : Vol avec Arduino en USB

```
1. Environnement : Production
2. Source : USB
3. Port : COM3 (vérifier dans le Gestionnaire de périphériques)
4. Débit : 115200
5. Enregistrer
6. → L'application se connecte au port série
```

### Scénario 4 : Développement avec WiFi

```
1. Environnement : Développement
2. Source : WiFi
3. IP : 192.168.4.1
4. Port : 81
5. Enregistrer
6. → Le panneau WiFi reste visible
7. → Vous pouvez changer l'IP à chaud
```

## Dépannage

### Le simulateur ne démarre pas

- Vérifiez que l'environnement est en "Développement"
- Vérifiez que la source est "Simulation"
- Rechargez la page

### Le panneau WiFi est invisible

- Vérifiez que l'environnement est en "Développement"
- En mode Production, les panneaux sont masqués (comportement normal)

### La connexion WiFi échoue

- Vérifiez l'adresse IP du microcontrôleur
- Vérifiez que le port est bien 81 (ou votre port personnalisé)
- Assurez-vous d'être connecté au bon réseau WiFi
- Consultez la console du navigateur (F12)

### Les paramètres ne sont pas sauvegardés

- VInitialiser la configuration au démarrage (charge config.ini si nécessaire)
await ConfigService.initialize();

// Récupérer la configuration complète
const config = ConfigService.getConfig();

// Vérifier le mode
if (ConfigService.isDevMode()) {
    console.log('Mode développement');
}

// Récupérer la source de données
const source = ConfigService.getDataSource(); // 'wifi', 'usb', 'simulation'

// Modifier la configuration
ConfigService.setEnvironment('prod');
ConfigService.setDataSource('wifi');
ConfigService.setWifiConfig('192.168.1.100', 81);

// Charger la configuration depuis un fichier INI
const config = await ConfigService.loadConfigFromFile();

// Parser un contenu INI
const configString = `
[General]
Environment = prod
DataSource = wifi
`;
const parsedConfig = ConfigService.parseINI(configString
Pour utiliser la configuration dans votre code :

```javascript
import { ConfigService } from './src/services/ConfigService.js';

// Récupérer la configuration complète
const config = ConfigService.getConfig();

// Vérifier le mode
if (ConfigService.isDevMode()) {
    console.log('Mode développement');
}

// Récupérer la source de données
const source = ConfigService.getDataSource(); // 'wifi', 'usb', 'simulation'

// Modifier la configuration
ConfigService.setEnvironment('prod');
ConfigService.setDataSource('wifi');
ConfigService.setWifiConfig('192.168.1.100', 81);

// Écouter les changements
document.addEventListener('configchange', (e) => {
    console.log('Nouvelle config:', e.detail);
});
```

## Fichiers créés/modifiés

### Nouveaux fichiers
- `src/services/ConfigService.js` : Service de gestion de configuration
- `scripts/configManager.js` : Gestionnaire de la modale
- `docs/configuration-guide.md` : Ce guide

### Fichiers modifiés
- `index.html` : Ajout du bouton et de la modale de configuration
- `partial/gauge_page.html` : Intégration de la configuration
- `src/utils/usbSimulator.js` : Respect du mode prod/dev
- `src/utils/wifiReader.js` : Respect du mode prod/dev
- `config/config.ini` : Structure de configuration mise à jour

## Évolutions futures possibles

- Export/Import de la configuration vers un fichier
- Synchronisation automatique avec config.ini via backend
- Profils de configuration (Vol de jour, Vol de nuit, etc.)
- Configuration avancée des jauges par profil
- API REST pour la configuration distante

---

**Auteur** : Système de configuration AeroDb  
**Version** : 1.0  
**Date** : 2026-03-03
