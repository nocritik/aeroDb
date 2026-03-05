/*
 * Demi-jauge carburant GAUCHE (arc côté gauche)
 * Graduations : 0 en bas, max en haut
 * Même comportement que tempEGTGaugeL : startAngle=5°, pas d'inversion,
 * l'aiguille part du bas (5°) vers le haut (175°) naturellement.
 */
export function fuelGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, isDoubleGauge) {

    var gaugeFuelL = new Gauge({
        renderTo:           canvasId,
        width:              300,
        height:             300,
        glow:               false,
        units:              unit,
        valueBoxPlace:      'center',
        valueBoxPlace_L_R:  'right',  // afficheur côté droit (zone centrale de la double jauge)
        valueFormat:        { "int": 3, "dec": 0 },
        title:              'Fuel',
        minValue:           gradMin,
        maxValue:           gradMax,
        majorTicks:         tabGrad,  // non inversé : 0 en bas (5°), max en haut (175°)
        minorTicks:         4,
        strokeTicks:        true,
        highlights: [
            { from: arc11, to: arc12, color: 'orange' },
            { from: arc21, to: arc22, color: 'green'  },
            { from: arc31, to: arc32, color: 'red'    }
        ],
        ticksAngle:  170,  // demi-jauge gauche
        startAngle:  5,    // début en bas (côté gauche) → 0 naturellement en bas

        colors: {
            plate:      '#222',
            majorTicks: '#f5f5f5',
            minorTicks: '#ddd',
            title:      '#fff',
            units:      '#ccc',
            numbers:    '#eee',
            needle: {
                type:  'line',
                start: 'red',
                end:   'red',
                circle: {
                    outerStart: '#333', outerEnd: '#111',
                    innerStart: '#111', innerEnd: '#222'
                },
                shadowUp: false, shadowDown: false
            },
            circle: {
                shadow:      false,
                outerStart:  '#333', outerEnd:  '#111',
                middleStart: '#222', middleEnd: '#111',
                innerStart:  '#111', innerEnd:  '#333'
            },
            valueBox: {
                rectStart: '#222', rectEnd: '#333',
                background: '#babab2', shadow: 'rgba(0, 0, 0, 1)'
            }
        },
        // Afficheur natif activé : valeur directe, pas d'inversion nécessaire
        valueBox:  { visible: true  },
        valueText: { visible: true  },
        animation: { delay: 25, duration: 1000, fn: 'linear' },
        updateValueOnAnimation: true
    });

    gaugeFuelL.onready = function () {
        // Push : mise à jour immédiate à la réception d'une trame USB
        document.addEventListener('flightdata', function (e) {
            if (e.detail.fuelL !== undefined) {
                gaugeFuelL.setValue(e.detail.fuelL);
            }
        });
        // Fallback polling quand USB / simulateur non connecté
        setInterval(function () {
            if (!usbReader.isConnected) {
                gaugeFuelL.setValue(dataFuelL());
            }
        }, 350);
    };

    // Aiguille initiale en bas (valeur gradMin = position de départ de l'arc à 5°)
    gaugeFuelL.setRawValue(parseFloat(gradMin));
    gaugeFuelL.draw();
}
