/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//*********************************************************************************************
//                          water temperature demi gauge left
//*********************************************************************************************
// MODIFICATION: Ajout du paramètre canvasId pour supporter plusieurs jauges du même type
export function tempWaterGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32) {
    var tempWaterGaugeL = new Gauge({
        renderTo: canvasId,  // CORRECTION: Utiliser l'ID unique passé en paramètre
        width: 300,
        height: 300,
        glow: false,
        units: unit,
        valueBoxPlace: 'center', //up center down
        valueBoxPlace_L_R: 'right', // left center right - DROITE pour gaugeL
        valueFormat: {
            "int": 3, // nb de chiffres avant la virgule
            "dec": 0  // pas de décimales
        },
        title: 'Water',
        minValue: gradMin,
        maxValue: gradMax,
        majorTicks: tabGrad,
        minorTicks: 4,
        strokeTicks: true,
        highlights: [
            { from: arc11, to: arc12, color: 'orange' },
            { from: arc21, to: arc22, color: 'green' },
            { from: arc31, to: arc32, color: 'red' }
        ],
        ticksAngle: 170, // angle total specifique au demi instrument gauche
        startAngle: 5,   // angle de depart specifique au demi instrument gauche

        colors: {
            plate: '#222',
            majorTicks: '#f5f5f5',
            minorTicks: '#ddd',
            title: '#fff',
            units: '#ccc',
            numbers: '#eee',
            needle: {
                type: 'line',
                start: 'red',
                end: 'red',
                circle: {
                    outerStart: '#333',
                    outerEnd: '#111',
                    innerStart: '#111',
                    innerEnd: '#222'
                },
                shadowUp: false,
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
        },
        valueBox: {
            visible: true  // ACTIVÉ: afficheur numérique centre-droite
        },
        valueText: {
            visible: true
        },
        animation: {
            delay: 25,
            duration: 1000,
            //fn : 'bounce'// rebon de l'eguille
            fn: 'linear'
        },
        updateValueOnAnimation: true
    });

    tempWaterGaugeL.onready = function () {
        // Push : mise à jour immédiate à la réception d'une trame USB
        document.addEventListener('flightdata', function (e) {
            if (e.detail.waterL !== undefined) {
                tempWaterGaugeL.setValue(e.detail.waterL);
            }
        });
        // Fallback simulation : polling toutes les 350 ms quand USB non connecté
        setInterval(function () {
            if (!usbReader.isConnected) {
                tempWaterGaugeL.setValue(dataWaterL());
            }
        }, 350);
    };
    tempWaterGaugeL.setRawValue(0);
    tempWaterGaugeL.draw();
};
