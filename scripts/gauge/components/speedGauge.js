/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//*********************************************************************************************
//                          speed gauge
//*********************************************************************************************
// MODIFICATION: Ajout du paramètre canvasId pour supporter plusieurs jauges du même type
export function speedGauge(canvasId, tabGrad,unit,gradMin,gradMax,affPosVert,affPostHor,arc11,arc12,arc21,arc22,arc31,arc32){
    var gaugeSpeed1 = new Gauge({
            renderTo: canvasId,  // CORRECTION: Utiliser l'ID unique passé en paramètre
            width: 300,
            height: 300,
            glow: true,
            units: unit,            
            title: 'SPEED',
            minValue: gradMin,
            maxValue: gradMax,
            majorTicks: tabGrad,
            minorTicks: 4,
            strokeTicks: true,
            highlights: [                        
                        {from: arc11, to: arc12, color: 'orange'},
                        {from: arc21, to: arc22, color: 'green'},
                        /*{from: arc31, to: arc32, color: 'rgba(200, 50, 50, .75)'}*/
                        {from: arc31, to: arc32, color: 'red'}],
            valueBoxPlace:affPosVert, //up center down
            valueBoxPlace_L_R:affPostHor,// left center right
           valueFormat: {
                        "int": 3, // nb de decimal avant la virgule
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
                visible: true
            },
            valueText: {
                visible: true
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

        gaugeSpeed1.onready = function () {
            setInterval(function () {
                var data = dataSpeed();
                gaugeSpeed1.setValue(data);
            }, 1500);
        };
        gaugeSpeed1.setRawValue(0);
        gaugeSpeed1.draw();
};
        