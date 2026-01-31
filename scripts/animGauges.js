/*
 * Animation des instruments de vol et jauges
 * Les indicateurs créés dynamiquement utilisent les fonctions data* ci-dessous
 */

//***************************************************************************
//                    FONCTIONS DATA POUR INDICATEURS DE VOL
//                    (jQuery Flight Indicators)
//***************************************************************************

//*******************set data value attitude (horizon artificiel)**************
function dataAttitudeRoll() {
    // Simule un roulis entre -30 et +30 degrés
    return 30 * Math.sin(Date.now() / 1000);
}

function dataAttitudePitch() {
    // Simule un tangage entre -20 et +20 degrés
    return 20 * Math.sin(Date.now() / 2000);
}
//******************************************

//*******************set data value heading (cap)**************
function dataHeading() {
    // Simule un cap qui tourne lentement (0-360)
    return (Date.now() / 100) % 360;
}
//******************************************

//*******************set data value altimeter**************
function dataAltitude() {
    // Simule une altitude entre 0 et 5000 pieds
    return 2500 + 2500 * Math.sin(Date.now() / 5000);
}

function dataPressure() {
    // Simule une pression atmosphérique entre 1000 et 1030 hPa
    return 1013 + 15 * Math.sin(Date.now() / 10000);
}
//******************************************

//*******************set data value turn coordinator (bille)**************
function dataTurnCoordinator() {
    // Simule un virage entre -30 et +30 degrés
    return 30 * Math.sin(Date.now() / 1500);
}
//******************************************

//*******************set data value variometer (flight indicator)**************
function dataVariometerFI() {
    // Simule un taux de montée/descente entre -2 et +2
    return 2 * Math.sin(Date.now() / 2000);
}
//****************************************** 



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
 
