/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//*********************************************************************************************
//                          tachimeter gauge
//*********************************************************************************************
// MODIFICATION: Ajout du paramètre canvasId pour supporter plusieurs jauges du même type
export function tachimeter(canvasId, tabGrad,unit,gradMin,gradMax,affPosVert,affPostHor,arc11,arc12,arc21,arc22,arc31,arc32){
    // Diviseur pour affichage x100 (graduations = valeur réelle / 100)
    var TACH_DIVISOR = 100;

    var gaugeTachimeter = new Gauge({
            renderTo: canvasId,  // CORRECTION: Utiliser l'ID unique passé en paramètre
            width: 300,
            height: 300,
            glow: true,
            units: unit,
            title: 'RPM',
            // Les graduations sont au 1/100 de la valeur réelle
            minValue: gradMin,
            maxValue: gradMax,
            majorTicks: tabGrad,
            minorTicks: 4,
            strokeTicks: true,
            // Les arcs sont aussi au 1/100
            highlights: [
                        {from: arc11, to: arc12, color: 'orange'},
                        {from: arc21, to: arc22, color: 'green'},
                        {from: arc31, to: arc32, color: 'red'}],
            valueBoxPlace:affPosVert, //up center down
            valueBoxPlace_L_R:affPostHor,// left center right
           valueFormat: {
                        "int": 4, // nb de decimal avant la virgule
                        "dec": 0 //nb de decimal apres la virgule
                        },
           colors: {
                plate: '#222',                
                majorTicks: '#f5f5f5',
                minorTicks: '#ddd',
                title: '#f5f5f5',
                units: '#ccc',
                numbers: '#f5f5f5',

                needle: { //eiguille
                  
                    start : 'red',
                    end : 'red',
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
            },
            valueBox: {
                visible: false  // Caché car on utilise un afficheur personnalisé
            },
            valueText: {
                visible: false  // Caché car on utilise un afficheur personnalisé
            },
            needle: { // format de l'eiguille
                type: 'arrow',
                width: 3,
                end: 72,
                circle: {
                    size: 7,
                    inner: false,
                    outer: true
                }
            },
            animation: {
                delay: 10,
                duration: 1500,
                fn: 'linear'
            },
            updateValueOnAnimation: true
        });

        // Créer l'afficheur numérique personnalisé pour la valeur réelle
        // Style défini dans flightindicators.css (.tachimeter-value-display)
        var canvas = document.getElementById(canvasId);
        var valueDisplay = document.createElement('div');
        valueDisplay.className = 'tachimeter-value-display';
        canvas.parentElement.style.position = 'relative';
        canvas.parentElement.appendChild(valueDisplay);
        valueDisplay.textContent = '0';

        gaugeTachimeter.onready = function () {
            // Mise à jour de la valeur cible toutes les 1500ms
            setInterval(function () {
                var data = dataTachimeter(); // Valeur réelle (ex: 7000)
                // Aiguille positionnée à valeur/100 (ex: 70)
                gaugeTachimeter.setValue(data / TACH_DIVISOR);
            }, 1500);

            // Mise à jour rapide de l'afficheur pour suivre l'animation de l'aiguille
            setInterval(function () {
                // Lire la valeur animée actuelle de la jauge et multiplier par 100
                var currentValue = gaugeTachimeter.value * TACH_DIVISOR;
                valueDisplay.textContent = Math.round(currentValue);
            }, 50); // Rafraîchissement toutes les 50ms pour fluidité
        };
        gaugeTachimeter.setRawValue(0);
        gaugeTachimeter.draw();
};
        