/*
 * Demi-jauge carburant DROITE (arc côté droit)
 * Graduations : 0 en bas, max en haut
 * Technique : inversion des ticks + inversion de la valeur (identique à tempEGTGaugeR)
 * startAngle=185° → arc de 185° (haut) à 355° (bas), inversion pour que 0 soit en bas.
 */
export function fuelGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, isDoubleGauge) {

    // Inverser les graduations pour avoir gradMax en haut (185°) et 0 en bas (355°)
    var tabGradReversed = tabGrad.slice().reverse();

    // Inverser les valeurs des arcs de couleur (from/to symétriques)
    var invertValue = function (val) {
        return parseFloat(gradMax) - parseFloat(val) + parseFloat(gradMin);
    };

    var gaugeFuelR = new Gauge({
        renderTo:           canvasId,
        width:              300,
        height:             300,
        glow:               false,
        units:              unit,
        valueBoxPlace:      'center',
        valueBoxPlace_L_R:  'left',   // afficheur côté gauche (zone centrale de la double jauge)
        valueFormat:        { "int": 3, "dec": 0 },
        title:              'Fuel',
        minValue:           gradMin,
        maxValue:           gradMax,
        majorTicks:         tabGradReversed,  // inversé : max en haut (185°), 0 en bas (355°)
        minorTicks:         4,
        strokeTicks:        true,
        highlights: [
            { from: invertValue(arc12), to: invertValue(arc11), color: 'orange' },
            { from: invertValue(arc22), to: invertValue(arc21), color: 'green'  },
            { from: invertValue(arc32), to: invertValue(arc31), color: 'red'    }
        ],
        ticksAngle:  170,   // demi-jauge droite
        startAngle:  185,   // début en haut (côté droit)

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
        valueBox:  { visible: false },  // afficheur natif désactivé (valeur inversée)
        valueText: { visible: true  },
        animation: { delay: 25, duration: GAUGE_ANIMATION_DURATION, fn: 'linear' },
        updateValueOnAnimation: true
    });

    // Afficheur numérique personnalisé (vraie valeur, pas l'inversée)
    // Visible uniquement en mode jauge simple (pas dans la double jauge)
    var canvas       = document.getElementById(canvasId);
    var canvasParent = canvas ? canvas.parentElement : null;
    var customDisplay = null;

    if (canvasParent && !isDoubleGauge) {
        customDisplay = document.createElement('div');
        customDisplay.className  = 'fuelGaugeR-value-display';
        customDisplay.textContent = '0';
        customDisplay.style.cssText =
            'position: absolute;'                        +
            'top: 50%;'                                  +
            'left: calc(50% - 100px);'                   +  // centre-gauche (comme tempEGTGaugeR)
            'transform: translateY(-50%);'               +
            'background: #babab2;'                       +
            'color: #444;'                               +
            'font-family: Led, Digital-7 Mono, Courier New, monospace;' +
            'font-size: 30px;'                           +
            'font-weight: normal;'                       +
            'min-width: 65px;'                           +
            'height: 28px;'                              +
            'line-height: 28px;'                         +
            'padding: 0 6px;'                            +
            'border-radius: 4px;'                        +
            'text-align: center;'                        +
            'box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);' +
            'z-index: 100;';
        canvasParent.style.position = 'relative';
        canvasParent.appendChild(customDisplay);
    }

    gaugeFuelR.onready = function () {
        // Push : mise à jour immédiate à la réception d'une trame USB
        document.addEventListener('flightdata', function (e) {
            if (e.detail.fuelR !== undefined) {
                var data         = e.detail.fuelR;
                var invertedData = invertValue(data);
                gaugeFuelR.setValue(invertedData);
                if (customDisplay) { customDisplay.textContent = Math.round(data); }
            }
        });
        // Fallback polling quand USB / simulateur non connecté
        setInterval(function () {
            if (!usbReader.isConnected) {
                var data         = dataFuelR();
                var invertedData = invertValue(data);
                gaugeFuelR.setValue(invertedData);
                if (customDisplay) { customDisplay.textContent = Math.round(data); }
            }
        }, 350);
    };

    // Valeur initiale inversée : aiguille en bas (là où "0" est affiché, à 355°)
    gaugeFuelR.setRawValue(parseFloat(gradMax));
    gaugeFuelR.draw();
}
