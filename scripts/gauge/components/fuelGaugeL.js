 /* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//*********************************************************************************************        
//                          fuel 2 demi gauge left
//*********************************************************************************************
function fuelGaugeL(tabGrad,unit,gradMin,gradMax,affPosVert,affPostHor,arc11,arc12,arc21,arc22,arc31,arc32){
        var gaugeFuelL = new Gauge({
            renderTo    : 'gaugeFuelL',
            width       : 300,
            height      : 300,
            glow        : false,
            units       : unit,
            valueBoxPlace:affPosVert, //up center down
            valueBoxPlace_L_R:affPostHor,// left center right
            title       : 'Fuel',
            minValue    : gradMin,//valua Min de echelle
            maxValue    : gradMax,// value Max de l'echelle
            majorTicks  : tabGrad, //graduation intermediaires
            minorTicks  : 4,//echelle etermediere
            strokeTicks : true,//contour echelle de meusure
            highlights  : [
                { from : arc11, to : arc12, color : 'orange' },
                { from : arc21, to : arc22, color : 'green' },
                { from : arc31, to : arc32, color : 'red' }
            ],
            ticksAngle: 170, // angle total specifique au demi instrument gauche
            startAngle: 5,  // angle de depart specifique au demi instrument gauche
            
            
            
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
               
                visible: false
            },
            valueText: {
                visible: false
            },
            
            animation : {
                delay : 25,
                duration: 1000,
                //fn : 'bounce'// rebon de l'eguille
                fn: 'linear'
            },
            updateValueOnAnimation: true
        });

        gaugeFuelL.onready = function() {
            setInterval(function() {
                var data = dataFuelL();
                gaugeFuelL.setValue(data);
            }, 1500);
        };
        gaugeFuelL.setRawValue(0);
        gaugeFuelL.draw();

    
};
