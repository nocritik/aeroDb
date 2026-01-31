/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//*********************************************************************************************        
//                          compass gauge 
//*********************************************************************************************    
// MODIFICATION: Ajout du paramètre canvasId pour supporter plusieurs jauges du même type
export function compass(canvasId){
        var gaugeCompass = new Gauge({
            renderTo: canvasId,  // CORRECTION: Utiliser l'ID unique passé en paramètre
            width: 300,
            height: 300,
            glow: false,
            units: false,
            valueBoxPlace:'center', //up center down
            valueBoxPlace_L_R:'center',// left center right
            title: false,
            minValue: 0,
            maxValue: 360,
            majorTicks: ['N', '', 'NE','', 'E','', 'SE','', 'S','', 'SW','', 'W','', 'NW','', 'N'],
            minorTicks: 5,
            ticksAngle: 360,
            startAngle: 180,
            strokeTicks: true,
            highlights: false,
            valueFormat: {
                "int": 3,
                "dec": 0
                },
            colors: {
                plate: '#222',
                majorTicks: '#f5f5f5',
                minorTicks: '#ddd',
                title: '#fff',
                units: '#ccc',
                numbers: '#eee',
                needle: {
                    start : 'red',
                    end : 'red',
                    circle: {
                        outerStart: '#ccc',
                        outerEnd: '#ccc',
                        innerStart: '#222',
                        innerEnd: '#222'
                    },
                    shadowUp: true,
                    shadowDown: true
                },
                valueBox: {
                    rectStart: '#888',
                    rectEnd: '#666',
                    background: '#babab2',
                    shadow: 'rgba(0, 0, 0, 1)'
                },
                valueText: {
                    foreground: '#444',
                    shadow: 'rgba(0, 0, 0, 0.3)'
                },
                circle: {
                    shadow: false,
                    outerStart: '#333',
                    outerEnd: '#111',
                    middleStart: '#222',
                    middleEnd: '#111',
                    innerStart: '#111',
                    innerEnd: '#333'
                }
            },
            circles: {
                outerVisible: true,
                middleVisible: true,
                innerVisible: true
            },
            needle: {
                type: 'line',
                end: 85,
                start: 35,
                width: 5,
                circle: {
                    size: 15,
                    inner: false,
                    outer: false
                }
            },
            valueBox: {
               
                visible: true
            },
            valueText: {
                visible: true
            },
            animation: {
                delay: 25,
                duration: 1000,
                fn: 'linear'
            },
            updateValueOnAnimation: true
        });

        gaugeCompass.onready = function () {
            setInterval(function () {
               var data = dataCompas();
                gaugeCompass.setValue(data);
            }, 1500);
        };
        gaugeCompass.setRawValue(0);
        gaugeCompass.draw();
        
};
