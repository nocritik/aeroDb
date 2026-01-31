/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// Imports des fonctions de jauge
import { speedGauge } from './speedGauge.js';
import { tempGauge } from './tempGauge.js';
import { tempGaugeL } from './tempGaugeL.js';
import { tempGaugeR } from './tempGaugeR.js';
import { compass } from './compassGauge.js';
import { variometreGauge } from './variometreGauge.js';
import { gaugeFuel } from './fuelGauge.js';
import { fuelGaugeL } from './fuelGaugeL.js';
import { fuelGaugeR } from './fuelGaugeR.js';
import { tachimeter } from './tachimeter.js';

export function addInstrument(gaugeId, gaugeType, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32) {

    var containerDiv = document.createElement("div");
    containerDiv.setAttribute("class", "container-canvas");
    var newGaugeContainer = document.querySelector('.gauge');
    newGaugeContainer.appendChild(containerDiv);


    for (var i = 1; i < 5; i++) {
        var imgVis = document.createElement("img");
        imgVis.setAttribute("class", "vis vis" + i);
        imgVis.setAttribute("src", "../img/vis.svg");
        containerDiv.appendChild(imgVis);
    };

    var inputHidden = document.createElement("input");
    inputHidden.setAttribute("type", "hidden");
    inputHidden.setAttribute("class", "gaugeId");
    inputHidden.setAttribute("value", gaugeId);
    containerDiv.appendChild(inputHidden);

    var canvasDiv = document.createElement("div");
    canvasDiv.setAttribute("id", "gaugeDivL" + gaugeId);
    canvasDiv.setAttribute("class", "classTemp");
    containerDiv.appendChild(canvasDiv);

    // Mapping sécurisé type → fonction (remplacement de eval() pour sécurité)
    var gaugeFunctions = {
        'gaugeSpeed1': gaugeSpeed1,
        'gaugeTemperature': gaugeTemperature,
        'gaugeCompass': gaugeCompass,
        'gaugeTemperatureL': gaugeTemperatureL,
        'gaugeTemperatureR': gaugeTemperatureR,
        'gaugeTemperatureD': gaugeTemperatureD,
        'attitude': attitude,
        'turn_coordinator': turn_coordinator,
        'heading': heading,
        'altimeter': altimeter,
        'variometer': variometer,
        'gaugeVariometer': gaugeVariometer,
        'gaugeFuel1': gaugeFuel1,
        'gaugeFuelL': gaugeFuelL,
        'gaugeFuelR': gaugeFuelR,
        'gaugeFuelD': gaugeFuelD,
        'gaugeTachimeter': gaugeTachimeter
    };

    var gaugeFunction = gaugeFunctions[gaugeType];
    if (gaugeFunction) {
        gaugeFunction();
    } else {
        console.error('Type de jauge inconnu:', gaugeType);
    }

    // CORRECTION BUG: Utiliser gaugeId pour créer des IDs uniques (évite les collisions)
    // Avant: id="gaugeSpeed1" pour toutes les jauges vitesse (collision!)
    // Après: id="gaugeSpeed1_0", "gaugeSpeed1_1", etc. (unique!)
    function createCanvas(gaugeType){
        var canvas = document.createElement("canvas");
        // ID unique = type + "_" + id (ex: "gaugeSpeed1_0", "gaugeSpeed1_1")
        var canvasId = gaugeType + "_" + gaugeId;
        canvas.setAttribute("id", canvasId);
        canvas.setAttribute("width", "300");
        canvas.setAttribute("height", "300");
        canvasDiv.appendChild(canvas);
        return canvasId; // Retourne l'ID pour le passer aux fonctions de jauge
    }
    function createCanvas1(gId){
        var canvasDiv1 = document.createElement("div");
        containerDiv.appendChild(canvasDiv1);
        var canvas1 = document.createElement("canvas");
        var canvasId = "canvas1_" + gId;
        canvas1.setAttribute("id", canvasId);
        canvas1.setAttribute("width", "300");
        canvas1.setAttribute("height", "300");
        canvasDiv1.appendChild(canvas1);
        return canvasId;
    }
    function createSpan(gaugeType){
        var span = document.createElement("span");
        var spanId = gaugeType + "_" + gaugeId;
        span.setAttribute("id", spanId);
        span.setAttribute("width", "300");
        span.setAttribute("height", "300");
        canvasDiv.appendChild(span);
        return spanId;
    }

    function gaugeSpeed1(){
        var canvasId = createCanvas(gaugeType);
        speedGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
     }
    function gaugeTemperature(){
        var canvasId = createCanvas(gaugeType);
        tempGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCompass(){
        var canvasId = createCanvas(gaugeType);
        compass(canvasId);
    }
    function gaugeTemperatureL(){
        var canvasId = createCanvas(gaugeType);
        tempGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeTemperatureR(){
        var canvasId = createCanvas(gaugeType);
        tempGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeTemperatureD(){
        var canvasIdL = createCanvas("gaugeTemperatureL");
        var canvasIdR = createCanvas1(gaugeId);
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        // Renommer le canvas1 pour tempGaugeR
        $("#canvas1_" + gaugeId).attr("id", "gaugeTemperatureR_" + gaugeId);
        tempGaugeL(canvasIdL, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        tempGaugeR("gaugeTemperatureR_" + gaugeId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, true);
        // Déplacer gaugeDivL à la fin du DOM pour qu'il soit au premier plan (au-dessus de tempGaugeR)
        var gaugeDivL = document.getElementById("gaugeDivL" + gaugeId);
        gaugeDivL.parentElement.appendChild(gaugeDivL);
    }
    // Instruments de vol utilisant jQuery Flight Indicators
    function attitude (){
        var spanId = createSpan(gaugeType);
        // Initialiser l'indicateur d'attitude (horizon artificiel)
        var indicator = $.flightIndicator('#' + spanId, 'attitude', {
            size: 200,
            roll: 0,
            pitch: 0,
            img_directory: '../img/'
        });
        // Animation avec les données simulées
        setInterval(function() {
            indicator.setRoll(dataAttitudeRoll());
            indicator.setPitch(dataAttitudePitch());
        }, 100);
    }
    function turn_coordinator() {
        var spanId = createSpan(gaugeType);
        // Initialiser l'indicateur de virage (bille)
        var indicator = $.flightIndicator('#' + spanId, 'turn_coordinator', {
            size: 200,
            turn: 0,
            img_directory: '../img/'
        });
        // Animation avec les données simulées
        setInterval(function() {
            indicator.setTurn(dataTurnCoordinator());
        }, 100);
    }
    function heading() {
        var spanId = createSpan(gaugeType);
        // Initialiser l'indicateur de cap (compas)
        var indicator = $.flightIndicator('#' + spanId, 'heading', {
            size: 200,
            heading: 0,
            img_directory: '../img/'
        });

        // Créer l'afficheur numérique au centre
        var valueDisplay = document.createElement('div');
        valueDisplay.className = 'heading-value-display';
        valueDisplay.textContent = '0';
        // L'ajouter à l'instrument heading
        var instrumentDiv = document.querySelector('#' + spanId + ' .instrument.heading');
        if (instrumentDiv) {
            instrumentDiv.appendChild(valueDisplay);
        }

        // Animation avec les données simulées
        setInterval(function() {
            var headingValue = dataHeading();
            indicator.setHeading(headingValue);
            // Mettre à jour l'afficheur numérique
            valueDisplay.textContent = Math.round(headingValue);
        }, 100);
    }
    function altimeter(){
        var spanId = createSpan(gaugeType);
        // Initialiser l'altimètre
        var indicator = $.flightIndicator('#' + spanId, 'altimeter', {
            size: 200,
            altitude: 0,
            pressure: 1013,
            img_directory: '../img/'
        });
        // Animation avec les données simulées
        setInterval(function() {
            indicator.setAltitude(dataAltitude());
            indicator.setPressure(dataPressure());
        }, 100);
    }
    function variometer(){
        var spanId = createSpan(gaugeType);
        // Initialiser le variomètre
        var indicator = $.flightIndicator('#' + spanId, 'variometer', {
            size: 200,
            vario: 0,
            img_directory: '../img/'
        });
        // Animation avec les données simulées
        setInterval(function() {
            indicator.setVario(dataVariometerFI());
        }, 100);
    }
    function gaugeVariometer(){
        var canvasId = createCanvas(gaugeType);
        variometreGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuel1(){
        var canvasId = createCanvas(gaugeType);
        gaugeFuel(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelL(){
        var canvasId = createCanvas(gaugeType);
        fuelGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelR(){
        var canvasId = createCanvas(gaugeType);
        fuelGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelD(){
        var canvasIdL = createCanvas("gaugeFuelL");
        var canvasIdR = createCanvas1(gaugeId);
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        // Renommer le canvas1 pour fuelGaugeR
        $("#canvas1_" + gaugeId).attr("id", "gaugeFuelR_" + gaugeId);
        fuelGaugeL(canvasIdL, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        fuelGaugeR("gaugeFuelR_" + gaugeId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeTachimeter(){
        var canvasId = createCanvas(gaugeType);
        tachimeter(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    
//    switch (gaugeType) {
//        case "gauge-speed1":
//
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//            speedGauge(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            break;
//
//        case "gauge-temperature":
//
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//            tempGauge(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            break;
//
//        case "gauge-compass":
//
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//            compass();
//            break;
//
//        case "gauge-temperatureL":
//
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//            tempGaugeL(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            break;
//
//        case "gauge-temperatureR":
//
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//            tempGaugeR(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            break;
//
//        case "gauge-temperatureD":
//
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//
//            canvasDiv1 = document.createElement("div");                 
//            containerDiv.appendChild(canvasDiv1);
//            canvas1 = document.createElement("canvas");
//            canvas1.setAttribute("id", "gauge-temperatureR");
//            canvas1.setAttribute("width", "300");
//            canvas1.setAttribute("height", "300");
//            canvasDiv1.appendChild(canvas1);
//
//            $("#" + gaugeType).attr("id", "gauge-temperatureL");
//            $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
//            tempGaugeL(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            tempGaugeR(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            break;
//
//        case "attitude":
//            span = document.createElement("span");
//            span.setAttribute("id", gaugeType);
//            span.setAttribute("width", "300");
//            span.setAttribute("height", "300");
//            canvasDiv.appendChild(span);
//
//            break;
//            
//        case "turn_coordinator":
//            span = document.createElement("span");
//            span.setAttribute("id", gaugeType);
//            span.setAttribute("width", "300");
//            span.setAttribute("height", "300");
//            canvasDiv.appendChild(span);
//            break;
//        
//        case "heading":
//            span = document.createElement("span");
//            span.setAttribute("id", gaugeType);
//            span.setAttribute("width", "300");
//            span.setAttribute("height", "300");
//            canvasDiv.appendChild(span);
//            break;
//        
//        case "altimeter":
//            span = document.createElement("span");
//            span.setAttribute("id", gaugeType);
//            span.setAttribute("width", "300");
//            span.setAttribute("height", "300");
//            canvasDiv.appendChild(span);
//            break;
//            
//         case "variometer":
//            span = document.createElement("span");
//            span.setAttribute("id", gaugeType);
//            span.setAttribute("width", "300");
//            span.setAttribute("height", "300");
//            canvasDiv.appendChild(span);
//            break;   
//        
//       case "gauge-variometer":
//            canvas = document.createElement("canvas");
//            canvas.setAttribute("id", gaugeType);
//            canvas.setAttribute("width", "300");
//            canvas.setAttribute("height", "300");
//            canvasDiv.appendChild(canvas);
//            variometreGauge(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
//            break;
//         
//        
//        default:
//            text = "defaut de type d'intrument";
//    }

    containerDiv.onclick = function () {
        $('#addInstModal').modal("show");
        var myDiv = $(this)["context"];
        var selectIput = myDiv.getElementsByTagName("input")[0].value;// retourne le num de l'instrument
        modalModifInst(selectIput);


    }; //Évènement ayant lieu lors du click sur la div
}
;


