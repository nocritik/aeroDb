/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// Imports des fonctions de jauge
import { speedGauge } from './speedGauge.js';
import { tempWaterGauge } from './tempWaterGauge.js';
import { tempWaterGaugeL } from './tempWaterGaugeL.js';
import { tempWaterGaugeR } from './tempWaterGaugeR.js';
import { compass } from './compassGauge.js';
import { variometreGauge } from './variometreGauge.js';
import { gaugeFuel } from './fuelGauge.js';
import { fuelGaugeL } from './fuelGaugeL.js';
import { fuelGaugeR } from './fuelGaugeR.js';
import { tachimeter } from './tachimeter.js';
import { tempCHTGauge } from './tempCHTGauge.js';
import { tempCHTGaugeL } from './tempCHTGaugeL.js';
import { tempCHTGaugeR } from './tempCHTGaugeR.js';
import { tempEGTGauge } from './tempEGTGauge.js';
import { tempEGTGaugeL } from './tempEGTGaugeL.js';
import { tempEGTGaugeR } from './tempEGTGaugeR.js';

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
        'gaugeCompass': gaugeCompass,
        'gaugeWater': gaugeWater,
        'gaugeWaterL': gaugeWaterL,
        'gaugeWaterR': gaugeWaterR,
        'gaugeWaterD': gaugeWaterD,
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
        'gaugeTachimeter': gaugeTachimeter,
        'gaugeCHT': gaugeCHT,
        'gaugeCHTL': gaugeCHTL,
        'gaugeCHTR': gaugeCHTR,
        'gaugeCHTD': gaugeCHTD,
        'gaugeEGT': gaugeEGT,
        'gaugeEGTL': gaugeEGTL,
        'gaugeEGTR': gaugeEGTR,
        'gaugeEGTD': gaugeEGTD
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
    function createCanvas(gaugeType) {
        var canvas = document.createElement("canvas");
        // ID unique = type + "_" + id (ex: "gaugeSpeed1_0", "gaugeSpeed1_1")
        var canvasId = gaugeType + "_" + gaugeId;
        canvas.setAttribute("id", canvasId);
        canvas.setAttribute("width", "300");
        canvas.setAttribute("height", "300");
        canvasDiv.appendChild(canvas);
        return canvasId; // Retourne l'ID pour le passer aux fonctions de jauge
    }
    function createCanvas1(gId) {
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
    function createSpan(gaugeType) {
        var span = document.createElement("span");
        var spanId = gaugeType + "_" + gaugeId;
        span.setAttribute("id", spanId);
        span.setAttribute("width", "300");
        span.setAttribute("height", "300");
        canvasDiv.appendChild(span);
        return spanId;
    }

    function gaugeSpeed1() {
        var canvasId = createCanvas(gaugeType);
        speedGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeWater() {
        var canvasId = createCanvas(gaugeType);
        tempWaterGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCompass() {
        var canvasId = createCanvas(gaugeType);
        compass(canvasId);
    }
    function gaugeWaterL() {
        var canvasId = createCanvas(gaugeType);
        tempWaterGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeWaterR() {
        var canvasId = createCanvas(gaugeType);
        tempWaterGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeWaterD() {
        var canvasIdL = createCanvas("gaugeWaterL");
        var canvasIdR = createCanvas1(gaugeId);
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        $("#canvas1_" + gaugeId).attr("id", "gaugeWaterR_" + gaugeId);
        tempWaterGaugeL(canvasIdL, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        tempWaterGaugeR("gaugeWaterR_" + gaugeId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, true);
        var gaugeDivL = document.getElementById("gaugeDivL" + gaugeId);
        gaugeDivL.parentElement.appendChild(gaugeDivL);
    }
    // Instruments de vol utilisant jQuery Flight Indicators
    function attitude() {
        var spanId = createSpan(gaugeType);
        var indicator = $.flightIndicator('#' + spanId, 'attitude', {
            size: 200,
            roll: 0,
            pitch: 0,
            img_directory: '../img/'
        });
        document.addEventListener('flightdata', function(e) {
            if (e.detail.roll !== undefined)  indicator.setRoll(e.detail.roll);
            if (e.detail.pitch !== undefined) indicator.setPitch(e.detail.pitch);
        });
    }
    function turn_coordinator() {
        var spanId = createSpan(gaugeType);
        var indicator = $.flightIndicator('#' + spanId, 'turn_coordinator', {
            size: 200,
            turn: 0,
            img_directory: '../img/'
        });
        document.addEventListener('flightdata', function(e) {
            if (e.detail.turnCoordinator !== undefined) indicator.setTurn(e.detail.turnCoordinator);
        });
    }
    function heading() {
        var spanId = createSpan(gaugeType);
        var indicator = $.flightIndicator('#' + spanId, 'heading', {
            size: 200,
            heading: 0,
            img_directory: '../img/'
        });

        var valueDisplay = document.createElement('div');
        valueDisplay.className = 'heading-value-display';
        valueDisplay.textContent = '0';
        var instrumentDiv = document.querySelector('#' + spanId + ' .instrument.heading');
        if (instrumentDiv) {
            instrumentDiv.appendChild(valueDisplay);
        }

        document.addEventListener('flightdata', function(e) {
            if (e.detail.heading !== undefined) {
                indicator.setHeading(e.detail.heading);
                valueDisplay.textContent = Math.round(e.detail.heading);
            }
        });
    }
    function altimeter() {
        var spanId = createSpan(gaugeType);
        var indicator = $.flightIndicator('#' + spanId, 'altimeter', {
            size: 200,
            altitude: 0,
            pressure: 1013,
            img_directory: '../img/'
        });
        document.addEventListener('flightdata', function(e) {
            if (e.detail.altitude !== undefined) indicator.setAltitude(e.detail.altitude);
            if (e.detail.pressure !== undefined) indicator.setPressure(e.detail.pressure);
        });
    }
    function variometer() {
        var spanId = createSpan(gaugeType);
        var indicator = $.flightIndicator('#' + spanId, 'variometer', {
            size: 200,
            vario: 0,
            img_directory: '../img/'
        });
        document.addEventListener('flightdata', function(e) {
            if (e.detail.variometer !== undefined) indicator.setVario(e.detail.variometer);
        });
    }
    function gaugeVariometer() {
        var canvasId = createCanvas(gaugeType);
        variometreGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuel1() {
        var canvasId = createCanvas(gaugeType);
        gaugeFuel(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelL() {
        var canvasId = createCanvas(gaugeType);
        fuelGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelR() {
        var canvasId = createCanvas(gaugeType);
        fuelGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelD() {
        var canvasIdL = createCanvas("gaugeFuelL");
        var canvasIdR = createCanvas1(gaugeId);
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        $("#canvas1_" + gaugeId).attr("id", "gaugeFuelR_" + gaugeId);
        fuelGaugeL(canvasIdL, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, true);
        fuelGaugeR("gaugeFuelR_" + gaugeId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, true);
        var gaugeDivL = document.getElementById("gaugeDivL" + gaugeId);
        gaugeDivL.parentElement.appendChild(gaugeDivL);
    }
    function gaugeTachimeter() {
        var canvasId = createCanvas(gaugeType);
        tachimeter(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCHT() {
        var canvasId = createCanvas(gaugeType);
        tempCHTGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCHTL() {
        var canvasId = createCanvas(gaugeType);
        tempCHTGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCHTR() {
        var canvasId = createCanvas(gaugeType);
        tempCHTGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCHTD() {
        var canvasIdL = createCanvas("gaugeCHTL");
        var canvasIdR = createCanvas1(gaugeId);
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        $("#canvas1_" + gaugeId).attr("id", "gaugeCHTR_" + gaugeId);
        tempCHTGaugeL(canvasIdL, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        tempCHTGaugeR("gaugeCHTR_" + gaugeId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, true);
        var gaugeDivL = document.getElementById("gaugeDivL" + gaugeId);
        gaugeDivL.parentElement.appendChild(gaugeDivL);
    }
    function gaugeEGT() {
        var canvasId = createCanvas(gaugeType);
        tempEGTGauge(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeEGTL() {
        var canvasId = createCanvas(gaugeType);
        tempEGTGaugeL(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeEGTR() {
        var canvasId = createCanvas(gaugeType);
        tempEGTGaugeR(canvasId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeEGTD() {
        var canvasIdL = createCanvas("gaugeEGTL");
        var canvasIdR = createCanvas1(gaugeId);
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        $("#canvas1_" + gaugeId).attr("id", "gaugeEGTR_" + gaugeId);
        tempEGTGaugeL(canvasIdL, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        tempEGTGaugeR("gaugeEGTR_" + gaugeId, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32, true);
        var gaugeDivL = document.getElementById("gaugeDivL" + gaugeId);
        gaugeDivL.parentElement.appendChild(gaugeDivL);
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


