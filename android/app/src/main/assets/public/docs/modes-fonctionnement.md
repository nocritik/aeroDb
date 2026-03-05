# Modes de fonctionnement — Simulation vs USB

## Variable de contrôle

Dans `scripts/animGauges.js`, la variable `simulation` est le seul interrupteur
à modifier pour basculer entre les deux modes :

```javascript
// Ligne ~32 dans animGauges.js
var simulation = true;   // true = simulation  |  false = USB
```

---

## Mode Simulation (`simulation = true`)

**Usage :** test de l'interface sans matériel connecté.

- Chaque fonction `data*()` génère une valeur mathématique (sinus, aléatoire)
- Aucune connexion USB n'est tentée, aucune bannière n'apparaît
- Les jauges se rafraîchissent toutes les **350 ms** via `setInterval`
- Les indicateurs de vol (horizon, cap, altimètre, bille) se rafraîchissent
  toutes les **100 ms**

```
simulation = true
      │
      ▼
data*() → Math.random() / Math.sin()
      │
      ▼
setInterval 350ms → gauge.setValue()
```

---

## Mode USB (`simulation = false`)

**Usage :** utilisation réelle avec microcontrôleur.

### Connexion automatique

Au chargement de la page (`DOMContentLoaded`) :

```
1. navigator.serial.getPorts()
        │
        ├── port(s) déjà autorisé(s) → connexion silencieuse et automatique
        │
        └── aucun port autorisé → bannière "Cliquez n'importe où..."
                  │
                  └── premier clic ou touche → dialog sélection port → connexion
```

> La sélection de port via dialog navigateur ne peut pas être déclenchée sans
> un geste utilisateur (contrainte de sécurité du navigateur).
> Lors des utilisations suivantes, la reconnexion est entièrement automatique.

### Mise à jour des jauges

```
Trame JSON reçue (port série USB)
      │
      ▼
_parseLine() → Object.assign(usbReader._data, parsed)
      │
      ▼
CustomEvent('flightdata', { detail: data })  ←── dispatché sur document
      │
      ├── speedGauge    → listener → gauge.setValue(e.detail.speed)   (immédiat)
      ├── compassGauge  → listener → gauge.setValue(e.detail.compass) (immédiat)
      ├── tachimeter    → listener → gauge.setValue(e.detail.rpm/100) (immédiat)
      ├── tempGauge     → listener → gauge.setValue(e.detail.temp)    (immédiat)
      ├── tempGaugeL    → listener → gauge.setValue(e.detail.tempL)   (immédiat)
      ├── tempGaugeR    → listener → gauge.setValue(inversion)        (immédiat)
      ├── variometreGauge → listener → gauge.setValue(e.detail.vario) (immédiat)
      ├── fuelGauge     → listener → gauge.setValue(e.detail.fuel)    (immédiat)
      ├── fuelGaugeL    → listener → gauge.setValue(e.detail.fuelL)   (immédiat)
      └── fuelGaugeR    → listener → gauge.setValue(e.detail.fuelR)   (immédiat)

Indicateurs de vol (addGauge.js) : setInterval 100ms → data*() → USB data
```

### Fallback si USB non encore connecté

Tant que `usbReader.isConnected === false`, le `setInterval` à 350ms de chaque
jauge est actif mais les `data*()` retournent **0** (mode USB sans connexion).

---

## Compatibilité navigateur

| Navigateur | Web Serial API | Testé |
|------------|---------------|-------|
| Chrome 89+ | ✅ Supporté   | ✅    |
| Edge 89+   | ✅ Supporté   | ✅    |
| Firefox    | ❌ Non supporté |     |
| Safari     | ❌ Non supporté |     |

---

## Configuration avancée

| Variable        | Fichier          | Description                          | Défaut  |
|-----------------|------------------|--------------------------------------|---------|
| `simulation`    | animGauges.js    | Mode de fonctionnement               | `true`  |
| `USB_BAUD_RATE` | animGauges.js    | Vitesse série (bauds)                | `9600`  |
