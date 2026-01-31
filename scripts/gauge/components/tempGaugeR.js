/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
// MODIFICATION: Ajout du paramètre canvasId pour supporter plusieurs jauges du même type
export function tempGaugeR(canvasId, tabGrad,unit,gradMin,gradMax,affPosVert,affPostHor,arc11,arc12,arc21,arc22,arc31,arc32, isDoubleGauge){
//*********************************************************************************************
//                          temperature 3 demi gauge right
//*********************************************************************************************
        // CORRECTION: Inverser les graduations pour avoir 0 en bas et max en haut
        // tout en gardant l'arc blanc du bon côté (à droite)
        var tabGradReversed = tabGrad.slice().reverse();

        // Inverser aussi les arcs de couleur (les valeurs from/to doivent être inversées)
        var invertValue = function(val) {
            return parseFloat(gradMax) - parseFloat(val) + parseFloat(gradMin);
        };

        var gaugeTemperatureR = new Gauge({
            renderTo    : canvasId,  // CORRECTION: Utiliser l'ID unique passé en paramètre
            width       : 300,
            height      : 300,
            glow        : false,
            units       : unit,
            valueBoxPlace:'center', //up center down
            valueBoxPlace_L_R:'left',// left center right - GAUCHE pour gaugeR
            valueFormat: {
                "int": 3, // nb de chiffres avant la virgule
                "dec": 0  // pas de décimales (comme speedGauge)
            },
            title       : 'Temp',
            minValue    : gradMin,//valua Min de echelle
            maxValue    : gradMax,// value Max de l'echelle
            majorTicks  : tabGradReversed,// graduations inversées (0 en bas, max en haut)
            minorTicks  : 4,//echelle etermediere
            strokeTicks : true,//contour echelle de meusure
            highlights  : [
                // Inverser les plages des arcs de couleur
                { from : invertValue(arc12), to : invertValue(arc11), color : 'orange' },
                { from : invertValue(arc22), to : invertValue(arc21), color : 'green' },
                { from : invertValue(arc32), to : invertValue(arc31), color : 'red' }
            ],
            ticksAngle: 170,// angle total POSITIF (arc blanc à droite)
            startAngle: 185, //angle de depart standard pour demi-jauge droite
            //strokeTicks: true,
            //highlights: false,
            
            colors      : {
                plate: '#222',
                majorTicks: '#f5f5f5',
                minorTicks: '#ddd',
                title: '#fff',
                units: '#ccc',
                numbers: '#eee',
                needle     : {
                    type:'line',
                    start : 'red',
                    end : 'red',
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
                visible: false  // DÉSACTIVÉ: on utilise un afficheur personnalisé pour afficher la vraie valeur
            },
            valueText: {
                visible: true
            },
            
            animation : {
                delay : 25,
                duration: 1000,
                //fn : 'bounce'// rebon de l'eguille
                fn: 'linear'
            },
            updateValueOnAnimation: true
        });

        // Créer l'afficheur numérique personnalisé (pour afficher la vraie valeur, pas l'inversée)
        // SEULEMENT si ce n'est pas une double gauge (isDoubleGauge = false ou undefined)
        var canvas = document.getElementById(canvasId);
        var canvasParent = canvas ? canvas.parentElement : null;
        var customDisplay = null;

        if (canvasParent && !isDoubleGauge) {
            customDisplay = document.createElement('div');
            customDisplay.className = 'tempGaugeR-value-display';
            customDisplay.textContent = '0';
            customDisplay.style.cssText =
                'position: absolute;' +
                'top: 50%;' +
                'left: calc(50% - 100px);' +  // Centre-gauche
                'transform: translateY(-50%);' +
                'background: #babab2;' +
                'color: #444;' +
                'font-family: Led, Digital-7 Mono, Courier New, monospace;' +
                'font-size: 30px;' +
                'font-weight: normal;' +
                'min-width: 65px;' +
                'height: 28px;' +
                'line-height: 28px;' +
                'padding: 0 6px;' +
                'border-radius: 4px;' +
                'text-align: center;' +
                'box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);' +
                'z-index: 100;';
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(customDisplay);
        }

        gaugeTemperatureR.onready = function() {
            setInterval(function() {
                var data = dataTempR();
                // Inverser la valeur pour que l'aiguille pointe au bon endroit
                // (0 en bas, valeurs hautes en haut)
                var invertedData = parseFloat(gradMax) - data + parseFloat(gradMin);
                gaugeTemperatureR.setValue(invertedData);

                // Mettre à jour l'afficheur personnalisé avec la VRAIE valeur
                if (customDisplay) {
                    customDisplay.textContent = Math.round(data);
                }
            }, 1500);
        };
        // Valeur initiale inversée (0 → gradMax pour pointer vers le bas où 0 est affiché)
        gaugeTemperatureR.setRawValue(parseFloat(gradMax));
        gaugeTemperatureR.draw();

};



