

// First static example
    var first_attitude = $.flightIndicator('#first_attitude', 'attitude', {size: 350, roll: 8, pitch: 3, showBox: true});
// Dyna// Dynamic examples
var attitude = $.flightIndicator('#attitude', 'attitude', {roll:50, pitch:-20, size:200, showBox : true});
var heading = $.flightIndicator('#heading', 'heading', {heading:150, showBox:true});
var variometer = $.flightIndicator('#variometer', 'variometer', {vario:-5, showBox:true});
var airspeed = $.flightIndicator('#airspeed', 'airspeed', {showBox: false});
var altimeter = $.flightIndicator('#altimeter', 'altimeter');
var turn_coordinator = $.flightIndicator('#turn_coordinator', 'turn_coordinator', {turn:0});

// Update at 20Hz
var increment = 0;
setInterval(function() {
    // Airspeed update
    airspeed.setAirSpeed(80+80*Math.sin(increment/10));

    // Attitude update
    attitude.setRoll(30*Math.sin(increment/10));
    attitude.setPitch(50*Math.sin(increment/20));

    // Altimeter update
    altimeter.setAltitude(10*increment);
    altimeter.setPressure(1000+3*Math.sin(increment/50));
    increment++;
    
    // TC update
    turn_coordinator.setTurn(30*Math.sin(increment/10));

    // Heading update
    heading.setHeading(increment);
    
    // Vario update
    variometer.setVario(2*Math.sin(increment/10));
    
}, 100); 



 //*******************set data value compass**************
function dataCompas() {
               var dataCompasGauge = Math.random() * 365;
         return dataCompasGauge;   
        };
 //******************************************  
 //*******************set data value speedGauge**************
function dataSpeed() {
               var dataSpeedGauge = Math.random() * (165 - 120) + 120;
         return dataSpeedGauge;   
        };
 //******************************************  
 //*******************set data value tempGauge**************
function dataTemp() {
               var dataTempGauge =  (Math.random() * 1 > .5 ? -1 : 1) * Math.random() * 50;
         return dataTempGauge;   
        };
 //******************************************  
//*******************set data value tempGaugeL**************
function dataTempL() {
               var dataTempGaugeL =  Math.random() * 120;
         return dataTempGaugeL;   
        };
 //****************************************** 
 //*******************set data value tempGaugeR**************
function dataTempR() {
               var dataTempGaugeR =   Math.random() * 120;
         return dataTempGaugeR;   
        };
 //******************************************   
 //*******************set data value variometreGauge**************
function dataVario() {
               var dataVariometreGauge = (Math.random() * 1 > .5 ? -1 : 1) * Math.random() * 50;
         return dataVariometreGauge;   
        };
 //******************************************   
  //*******************set data value tempGaugeR**************
function dataFuelR() {
               var dataFuelGaugeR =   Math.random() * 120;
         return dataFuelGaugeR;   
        };
 //****************************************** 
   //*******************set data value tempGaugeR**************
function dataFuelL() {
               var dataFuelGaugeL =   Math.random() * 120;
         return dataFuelGaugeL;   
        };
 //****************************************** 
    //*******************set data value tempGaugeR**************
function dataFuel() {
               var dataFuelGauge =   (Math.random() * 1 > .5 ? -1 : 1) * Math.random() * 50;
         return dataFuelGauge;   
        };
 //****************************************** 
 
