window.onload = function () {

//*********************************************************************************************        
//                          speed gauge 
//*********************************************************************************************
       var gaugeSpeed1 = new Gauge({
            renderTo: 'gauge-speed1',
            width: 300,
            height: 300,
            glow: true,
            units: 'Km/h',            
            title: 'SPEED',
            minValue: 0,
            maxValue: 240,
            majorTicks: ['0', '20', '40', '60', '80', '100', '120', '140', '160', '180', '200', '220', '240'],
            minorTicks: 2,
            strokeTicks: true,
            highlights: [{from: 0, to: 65, color: 'red'},{from: 65, to: 160, color: 'green'},{from: 160, to: 220, color: 'orange'},{from: 220, to: 240, color: 'rgba(200, 50, 50, .75)'}],
            valueBoxPlace:'down', //up center down
            valueBoxPlace_L_R:'center',// left center right
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
                gaugeSpeed1.setValue(Math.random() * (165 - 120) + 120);
            }, 1500);
        };
        gaugeSpeed1.setRawValue(0);
        gaugeSpeed1.draw();
        
//*********************************************************************************************        
//                          temperature gauge 
//*********************************************************************************************
            var gaugeTemperature = new Gauge({
            renderTo    : 'gauge-temperature',
            width       : 300,
            height      : 300,
            glow        : false,
            units       : '°C',           
            title       : 'Temperature',
            valueBoxPlace:'center', //up center down
            valueBoxPlace_L_R:'right',// left center right
            maxValue: 0,
            minValue: 100,
            majorTicks: [],
            minorTicks: 10,
            ticksAngle: 270,
            startAngle: 0,
            strokeTicks: true,
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
            },
            updateValueOnAnimation: true
        });

        gaugeTemperature.onready = function() {
            setInterval(function() {
                gaugeTemperature.setValue(
                    (Math.random() * 1 > .5 ? -1 : 1) * Math.random() * 50
                );
            }, 1500);
        };
        gaugeTemperature.setRawValue(0);
        gaugeTemperature.draw();
//*********************************************************************************************        
//                          compass gauge 
//*********************************************************************************************        
        var gaugeCompass = new Gauge({
            renderTo: 'gauge-compass',
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
                //gaugeCompass.setValue(Math.random() * (195 - 165) + 165);
                gaugeCompass.setValue(Math.random() * 365);
            }, 1500);
        };
        gaugeCompass.setRawValue(0);
        gaugeCompass.draw();
        
//*********************************************************************************************        
//                          temperature 2 demi gauge left
//*********************************************************************************************
        var gaugeTemperature2 = new Gauge({
            renderTo    : 'gauge-temperature2',
            width       : 300,
            height      : 300,
            glow        : false,
            units       : '°C',
            //valueBoxPlace:'center', //up center down
            //valueBoxPlace_L_R:'left',// left center right
            title       : 'Temperature',
            minValue    : 0,//valua Min de echelle
            maxValue    : 120,// value Max de l'echelle
            majorTicks  : ['0','20','40','60','80','100','1'],
            minorTicks  : 5,//echelle etermediere
            strokeTicks : true,//contour echelle de meusure
            highlights  : [
                { from : 0, to : 60, color : 'orange' },
                { from : 60, to : 90, color : 'green' },
                { from : 90, to : 120, color : 'red' }
            ],
            ticksAngle: 170,
            startAngle: 5,
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

        gaugeTemperature2.onready = function() {
            setInterval(function() {
                gaugeTemperature2.setValue(
                     Math.random() * 120
                );
            }, 1500);
        };
        gaugeTemperature2.setRawValue(0);
        gaugeTemperature2.draw();



//*********************************************************************************************        
//                          temperature 3 demi gauge right
//*********************************************************************************************
        var gaugeTemperature3 = new Gauge({
            renderTo    : 'gauge-temperature3',
            width       : 300,
            height      : 300,
            glow        : false,
            units       : '°C',
            //valueBoxPlace:'center', //up center down
            //valueBoxPlace_L_R:'right',// left center right
            title       : 'Temperature',
            minValue    : 0,//valua Min de echelle
            maxValue    : 120,// value Max de l'echelle
            majorTicks  : ['20','100','80','60','40','20','0'],
            minorTicks  : 5,//echelle etermediere
            strokeTicks : true,//contour echelle de meusure
            highlights  : [
                { from : 0, to : 70, color : 'orange' },
                { from : 70, to : 90, color : 'green' },
                { from : 90, to : 120, color : 'red' }
            ],
            ticksAngle: 170,
            startAngle: 185,
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

        gaugeTemperature3.onready = function() {
            setInterval(function() {
                gaugeTemperature3.setValue(
                     Math.random() * 120
                );
            }, 1500);
        };
        gaugeTemperature3.setRawValue(0);
        gaugeTemperature3.draw();

};
