/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//*********************************************************************************************
//                          temperature gauge
//*********************************************************************************************
// MODIFICATION: Ajout du paramètre canvasId pour supporter plusieurs jauges du même type
export function tempGauge(canvasId, tabGrad,unit,gradMin,gradMax,affPosVert,affPostHor,arc11,arc12,arc21,arc22,arc31,arc32){
        var tempGauge = new Gauge({
            renderTo    : canvasId,  // CORRECTION: Utiliser l'ID unique passé en paramètre
            width       : 300,
            height      : 300,
            glow        : false,
            units       : unit,           
            title       : 'Temp',
            valueBoxPlace:affPosVert, //up center down
            valueBoxPlace_L_R:affPostHor,// left center right
            maxValue: gradMax,
            minValue: gradMin,
            majorTicks: tabGrad, // garduations intermediaires
            minorTicks: 4,
            //ticksAngle: 270,
            //startAngle: 225,
            strokeTicks: true,
            highlights: [                       
                        {from: arc11, to: arc12, color: 'orange'},
                        {from: arc21, to: arc22, color: 'green'},
                        {from: arc31, to: arc32, color: 'rgba(200, 50, 50, .75)'}
                        /*{from: 0, to: 65, color: 'red'}*/ ],
            updateValueOnAnimation: true,
            valueFormat: {
                    "int": 3,
                    "dec": 0
                    },
        
        
            colors      : {
                plate: '#222',
                majorTicks: '#f5f5f5',
                minorTicks: '#ddd',
                title: '#fff',
                units: '#ccc',
                numbers: '#eee',
                needle     : {
                   /* start : 'rgba(240, 128, 128, 1)',
                    end : 'rgba(255, 160, 122, .9)',*/
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
            needle: {
                type: 'arrow',
                width: 4,
                end: 72,
                circle: {
                    size: 10,
                    inner: true,
                    outer: true
                }
            },
            animation : {
                delay : 25,
                duration: 1000,
                //fn : 'bounce'// rebon de l'eguille
                fn: 'linear'
            }
            //updateValueOnAnimation: true
        });
        
        tempGauge.onready = function() {
            setInterval(function() {
               var data = dataTemp(); 
                tempGauge.setValue(data);
            }, 1500);
        };
        tempGauge.setRawValue(0);
        tempGauge.draw();
 };
