# AeroDb - Claude Code Configuration

## Project Overview

**AeroDb** is a web-based aviation navigation toolkit for ultralight (ULM) and light aircraft pilots. It provides customizable flight instruments and an interactive navigation map.

**Tech Stack:** Vanilla JavaScript, jQuery 1.12.3, Bootstrap 3.3.6, Leaflet.js, Canvas Gauge libraries

**Key Features:**
- Customizable flight instruments (airspeed, temperature, compass, altimeter, variometer, fuel)
- Interactive navigation map with aerodrome markers
- Real-time flight data display
- LocalStorage-based configuration persistence

---

## Commands

### Development Server
```bash
# Start local server to avoid CORS issues
python -m http.server 8000
# OR
npx http-server
```

### Open Application
```bash
# Navigate to
http://localhost:8000/index.html
```

---

## Code Style & Conventions

### JavaScript
- **IMPORTANT:** Use ES6+ syntax for new code (classes, modules, arrow functions, const/let)
- Avoid global functions - encapsulate in classes or modules
- Use meaningful variable names in English (current code mixes French)
- Use PascalCase for classes, camelCase for variables/functions
- Add JSDoc comments for all public methods

### File Organization
```
src/
├── core/              # Core application classes
├── models/            # Data models
├── views/             # UI components
├── controllers/       # Business logic
├── services/          # External services (storage, API)
└── utils/             # Helper functions
```

### Naming Conventions
- **Classes:** `GaugeController`, `NavigationService`
- **Files:** Match class names: `GaugeController.js`
- **CSS Classes:** BEM methodology: `gauge__display--active`

---

## Current Architecture (Legacy)

### Problems Identified
❌ **Procedural code** - Functions in global scope
❌ **No separation of concerns** - DOM manipulation mixed with business logic
❌ **Tight coupling** - Direct dependencies between components
❌ **No state management** - Data scattered across localStorage and DOM
❌ **No modularity** - No ES6 modules, script tag dependencies
❌ **Lack of type safety** - No TypeScript or JSDoc types

### Current File Structure
```
scripts/
├── event.js                 # Mixed event handlers (UI + navigation)
├── gauge/
│   ├── components/          # Individual gauge functions
│   │   ├── speedGauge.js   # Procedural gauge creation
│   │   ├── tempGauge.js
│   │   └── ...
│   ├── loaderGauge.js      # Loops through localStorage
│   └── saveGauge.js        # Direct localStorage writes
└── nav/
    ├── initCarte.js        # Direct map initialization
    └── layerMarkerBase.js  # Marker management
```

**Example of Current Code (Procedural):**
```javascript
// speedGauge.js - LEGACY PATTERN
function speedGauge(tabGrad, unit, gradMin, gradMax, ...) {
    var gaugeSpeed1 = new Gauge({ /* config */ });
    gaugeSpeed1.onready = function() {
        setInterval(function() {
            var data = dataSpeed();
            gaugeSpeed1.setValue(data);
        }, 1500);
    };
}
```

---

## Proposed Architecture (Object-Oriented MVVM)

### Why MVVM?
Based on [modern web architecture best practices](https://dev.to/chiragagg5k/architecture-patterns-for-beginners-mvc-mvp-and-mvvm-2pe7), MVVM is ideal for:
- ✅ Complex data binding
- ✅ Real-time UI updates (flight instruments)
- ✅ Separation of concerns
- ✅ Testability
- ✅ Reactive interfaces

### Architecture Layers

```
┌─────────────────────────────────────────────┐
│              VIEW (HTML/CSS)                │
│  - gauge_page.html, nav_page.html          │
└─────────────────┬───────────────────────────┘
                  │ Two-way binding
┌─────────────────▼───────────────────────────┐
│            VIEW MODEL                       │
│  - GaugeViewModel.js                       │
│  - NavigationViewModel.js                  │
│  - Observable state + Commands             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              MODEL                          │
│  - GaugeConfig.js (data structure)         │
│  - FlightData.js (real-time data)          │
│  - AerodromeData.js                        │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            SERVICES                         │
│  - StorageService.js (localStorage)        │
│  - MapService.js (Leaflet wrapper)         │
│  - DataService.js (data source)            │
└─────────────────────────────────────────────┘
```

### Proposed File Structure
```
src/
├── core/
│   ├── App.js                    # Main application entry
│   ├── EventBus.js               # Global event system
│   └── Observable.js             # Reactive data pattern
├── models/
│   ├── GaugeConfig.js            # Gauge configuration model
│   ├── FlightData.js             # Real-time flight data
│   └── Aerodrome.js              # Aerodrome information
├── viewmodels/
│   ├── GaugeViewModel.js         # Gauge page logic
│   └── NavigationViewModel.js    # Navigation page logic
├── views/
│   ├── components/
│   │   ├── SpeedGauge.js        # Speed gauge component
│   │   ├── TempGauge.js         # Temperature gauge
│   │   └── GaugeFactory.js      # Factory pattern for gauges
│   └── GaugeView.js             # View orchestrator
├── services/
│   ├── StorageService.js        # LocalStorage abstraction
│   ├── MapService.js            # Leaflet wrapper
│   └── DataService.js           # Data fetching/updating
└── utils/
    ├── validators.js            # Input validation
    └── converters.js            # Unit conversions
```

### Core Classes Design

#### 1. Observable Pattern (Core)
```javascript
// src/core/Observable.js
export class Observable {
    constructor(value) {
        this._value = value;
        this._listeners = [];
    }

    get value() { return this._value; }

    set value(newValue) {
        if (this._value !== newValue) {
            this._value = newValue;
            this._notify();
        }
    }

    subscribe(listener) {
        this._listeners.push(listener);
        return () => this._unsubscribe(listener);
    }

    _notify() {
        this._listeners.forEach(fn => fn(this._value));
    }
}
```

#### 2. Model Example
```javascript
// src/models/GaugeConfig.js
export class GaugeConfig {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.type = data.type || 'speed';
        this.unit = data.unit || 'Km/h';
        this.minValue = data.minValue || 0;
        this.maxValue = data.maxValue || 200;
        this.graduations = data.graduations || [];
        this.displayPosition = {
            vertical: data.displayPosition?.vertical || 'down',
            horizontal: data.displayPosition?.horizontal || 'center'
        };
        this.arcs = {
            yellow: data.arcs?.yellow || { min: 0, max: 0 },
            green: data.arcs?.green || { min: 0, max: 0 },
            red: data.arcs?.red || { min: 0, max: 0 }
        };
    }

    validate() {
        if (!this.type) throw new Error('Gauge type is required');
        if (this.minValue >= this.maxValue) {
            throw new Error('Min value must be less than max value');
        }
        return true;
    }

    toJSON() {
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
}
```

#### 3. ViewModel Example
```javascript
// src/viewmodels/GaugeViewModel.js
import { Observable } from '../core/Observable.js';
import { GaugeConfig } from '../models/GaugeConfig.js';
import { StorageService } from '../services/StorageService.js';

export class GaugeViewModel {
    constructor() {
        this.gauges = new Observable([]);
        this.selectedGauge = new Observable(null);
        this.storageService = new StorageService();

        this.loadGauges();
    }

    loadGauges() {
        const configs = this.storageService.getAllGauges();
        this.gauges.value = configs.map(cfg => new GaugeConfig(cfg));
    }

    addGauge(config) {
        const gauge = new GaugeConfig(config);
        gauge.validate();

        this.storageService.saveGauge(gauge.toJSON());
        this.gauges.value = [...this.gauges.value, gauge];
    }

    updateGauge(id, updates) {
        const index = this.gauges.value.findIndex(g => g.id === id);
        if (index === -1) throw new Error('Gauge not found');

        const updated = new GaugeConfig({
            ...this.gauges.value[index],
            ...updates
        });
        updated.validate();

        this.storageService.updateGauge(id, updated.toJSON());

        const newGauges = [...this.gauges.value];
        newGauges[index] = updated;
        this.gauges.value = newGauges;
    }

    deleteGauge(id) {
        this.storageService.deleteGauge(id);
        this.gauges.value = this.gauges.value.filter(g => g.id !== id);
    }
}
```

#### 4. Service Example
```javascript
// src/services/StorageService.js
export class StorageService {
    constructor(prefix = 'aero_') {
        this.prefix = prefix;
    }

    _getKey(id) {
        return `${this.prefix}${id}`;
    }

    saveGauge(config) {
        const key = this._getKey(config.id);
        localStorage.setItem(key, JSON.stringify(config));
    }

    getGauge(id) {
        const key = this._getKey(id);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    getAllGauges() {
        const gauges = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const data = localStorage.getItem(key);
                gauges.push(JSON.parse(data));
            }
        }
        return gauges;
    }

    updateGauge(id, config) {
        this.saveGauge(config);
    }

    deleteGauge(id) {
        const key = this._getKey(id);
        localStorage.removeItem(key);
    }
}
```

#### 5. View Component Example
```javascript
// src/views/components/SpeedGauge.js
export class SpeedGauge {
    constructor(containerId, config) {
        this.containerId = containerId;
        this.config = config;
        this.gauge = null;
    }

    render() {
        this.gauge = new Gauge({
            renderTo: this.containerId,
            width: 300,
            height: 300,
            units: this.config.unit,
            title: 'SPEED',
            minValue: this.config.minValue,
            maxValue: this.config.maxValue,
            majorTicks: this.config.graduations,
            highlights: [
                { from: this.config.arcs.yellow.min, to: this.config.arcs.yellow.max, color: 'orange' },
                { from: this.config.arcs.green.min, to: this.config.arcs.green.max, color: 'green' },
                { from: this.config.arcs.red.min, to: this.config.arcs.red.max, color: 'red' }
            ],
            valueBoxPlace: this.config.displayPosition.vertical,
            valueBoxPlace_L_R: this.config.displayPosition.horizontal,
            // ... other config
        });

        this.gauge.draw();
    }

    updateValue(value) {
        if (this.gauge) {
            this.gauge.setValue(value);
        }
    }

    destroy() {
        if (this.gauge) {
            // Cleanup gauge
            this.gauge = null;
        }
    }
}
```

#### 6. Factory Pattern for Gauge Creation
```javascript
// src/views/components/GaugeFactory.js
import { SpeedGauge } from './SpeedGauge.js';
import { TempGauge } from './TempGauge.js';
import { CompassGauge } from './CompassGauge.js';

export class GaugeFactory {
    static create(config) {
        const gaugeMap = {
            'gaugeSpeed1': SpeedGauge,
            'gaugeTemperature': TempGauge,
            'gaugeCompass': CompassGauge,
            // ... other gauge types
        };

        const GaugeClass = gaugeMap[config.type];
        if (!GaugeClass) {
            throw new Error(`Unknown gauge type: ${config.type}`);
        }

        return new GaugeClass(config.id, config);
    }
}
```

---

## Migration Strategy

### Phase 1: Setup Modern Build System
1. Add package.json with ES6 module support
2. Setup build tool (Vite or Webpack)
3. Configure linting (ESLint) and formatting (Prettier)
4. Add TypeScript (optional but recommended)

### Phase 2: Create Core Infrastructure
1. Implement Observable pattern
2. Create EventBus for global events
3. Build StorageService abstraction
4. Setup service layer

### Phase 3: Migrate Gauge System
1. Create GaugeConfig model
2. Implement GaugeViewModel
3. Refactor each gauge type into class component
4. Implement GaugeFactory
5. Update gauge_page.html to use new system

### Phase 4: Migrate Navigation System
1. Create NavigationViewModel
2. Wrap Leaflet in MapService
3. Create Aerodrome model
4. Refactor marker layers

### Phase 5: Modernize UI
1. Update Bootstrap 3 → Bootstrap 5
2. Consider modern UI framework (Vue.js for MVVM)
3. Implement component-based architecture

---

## Testing Strategy

### Unit Tests
```javascript
// Example: GaugeConfig.test.js
import { GaugeConfig } from '../src/models/GaugeConfig.js';

describe('GaugeConfig', () => {
    test('should create valid config', () => {
        const config = new GaugeConfig({
            type: 'speed',
            minValue: 0,
            maxValue: 200
        });
        expect(config.validate()).toBe(true);
    });

    test('should throw on invalid range', () => {
        const config = new GaugeConfig({
            minValue: 200,
            maxValue: 0
        });
        expect(() => config.validate()).toThrow();
    });
});
```

### Integration Tests
- Test ViewModel ↔ Service interactions
- Test data persistence
- Test UI bindings

---

## Dependencies to Add

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "bootstrap": "^5.3.2"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@types/leaflet": "^1.9.8",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "vitest": "^1.1.0"
  }
}
```

---

## Important Design Principles

### SOLID Principles
- **S**ingle Responsibility: Each class has one job
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Use interfaces/base classes
- **I**nterface Segregation: Small, focused interfaces
- **D**ependency Inversion: Depend on abstractions

### DRY (Don't Repeat Yourself)
- Extract common gauge configuration to base class
- Reuse validation logic
- Centralize storage operations

### KISS (Keep It Simple)
- Don't over-engineer
- Start with simple classes, refactor when needed
- Avoid premature optimization

---

## Code Quality Rules

### MUST DO
- ✅ Write JSDoc for all public methods
- ✅ Validate all user inputs
- ✅ Handle errors gracefully (try/catch)
- ✅ Use const/let, never var
- ✅ Use meaningful variable names
- ✅ Extract magic numbers to constants

### NEVER DO
- ❌ Use global variables
- ❌ Mutate parameters
- ❌ Mix French and English
- ❌ Leave console.log in production
- ❌ Use alert() for errors
- ❌ Directly access localStorage outside services

---

## Performance Considerations

### Canvas Rendering
- Reuse gauge instances when possible
- Debounce rapid updates
- Use requestAnimationFrame for animations

### LocalStorage
- Batch writes when possible
- Cache frequently accessed data
- Consider IndexedDB for larger datasets

### Map Performance
- Lazy load marker data
- Cluster markers when zoomed out
- Limit visible markers

---

## Security Considerations

### Input Validation
- Validate all form inputs before processing
- Sanitize values before rendering
- Use type checking (TypeScript recommended)

### LocalStorage
- Don't store sensitive data
- Validate data read from storage
- Handle corrupted data gracefully

---

## Resources

### Architecture Patterns
- [MVC vs MVVM Patterns](https://dev.to/chiragagg5k/architecture-patterns-for-beginners-mvc-mvp-and-mvvm-2pe7)
- [MVVM in JavaScript](https://www.codeproject.com/Articles/5265632/Introducing-MVVM-Architecture-in-JavaScript-TypeSc)
- [Modern JavaScript Architecture](https://addyosmani.com/largescalejavascript/)

### Best Practices
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [CLAUDE.md Guidelines](https://blog.devgenius.io/what-great-claude-md-files-have-in-common-db482172ad2c)
- [JavaScript Design Patterns](https://www.patterns.dev/)

### Libraries
- [Leaflet.js Documentation](https://leafletjs.com/)
- [Bootstrap 5 Migration Guide](https://getbootstrap.com/docs/5.3/migration/)

---

## Quick Reference

### Add New Gauge Type
1. Create gauge class in `src/views/components/NewGauge.js`
2. Add to GaugeFactory mapping
3. Add form option in gauge_page.html
4. Test with unit tests

### Debug LocalStorage Issues
```javascript
// View all stored gauges
const storage = new StorageService();
console.table(storage.getAllGauges());

// Clear all data
localStorage.clear();
```

### Common Pitfalls
- Forgetting to bind event handlers in classes (use arrow functions)
- Not unsubscribing from observables (memory leaks)
- Mutating state directly instead of through ViewModel
- Mixing old procedural code with new OO code

---

**Last Updated:** 2026-01-30
**Maintainer:** Refer to repository owner
