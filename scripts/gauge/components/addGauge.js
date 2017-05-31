/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function addInstrument(gaugeId, gaugeType, tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32) {

    var containerDiv = document.createElement("div");
    containerDiv.setAttribute("class", "container-canvas");
    newGaugeContainer = document.querySelector('.gauge');
    newGaugeContainer.appendChild(containerDiv);


    for (var i = 1; i < 5; i++) {
        imgVis = document.createElement("img");
        imgVis.setAttribute("class", "vis vis" + i);
        imgVis.setAttribute("src", "../img/vis.svg");
        containerDiv.appendChild(imgVis);
    };

    inputHidden = document.createElement("input");
    inputHidden.setAttribute("type", "hidden");
    inputHidden.setAttribute("class", "gaugeId");
    inputHidden.setAttribute("value", gaugeId);
    containerDiv.appendChild(inputHidden);

    var canvasDiv = document.createElement("div");
    canvasDiv.setAttribute("id", "gaugeDivL" + gaugeId);
    canvasDiv.setAttribute("class", "classTemp");
    containerDiv.appendChild(canvasDiv);

    eval(gaugeType + "()");

    function createCanvas(gaugeType){
        canvas = document.createElement("canvas");
        canvas.setAttribute("id", gaugeType);
        canvas.setAttribute("width", "300");
        canvas.setAttribute("height", "300");
        canvasDiv.appendChild(canvas);
    }
    function createCanvas1(gaugeId){
        var canvasDiv1 = document.createElement("div");                 
        containerDiv.appendChild(canvasDiv1);
        var canvas1 = document.createElement("canvas");
        canvas1.setAttribute("id", "canvas1"+gaugeId);
        canvas1.setAttribute("width", "300");
        canvas1.setAttribute("height", "300");
        canvasDiv1.appendChild(canvas1);
    }    
    function createSpan(gaugeType){
        var span = document.createElement("span");
        span.setAttribute("id", gaugeType);
        span.setAttribute("width", "300");
        span.setAttribute("height", "300");
        canvasDiv.appendChild(span);
    }
    
    function gaugeSpeed1(){
        createCanvas(gaugeType);
        speedGauge(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
     }
    function gaugeTemperature(){
        createCanvas(gaugeType);
        tempGauge(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeCompass(){
        createCanvas(gaugeType);
        compass(); 
    }    
    function gaugeTemperatureL(){
        createCanvas(gaugeType);
        tempGaugeL(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeTemperatureR(){
         createCanvas(gaugeType);
        tempGaugeR(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeTemperatureD(){
        createCanvas(gaugeType);
        createCanvas1(gaugeId);        
        $("#" + gaugeType).attr("id", "gaugeTemperatureL");
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        $("#canvas1"+gaugeId).attr("id","gaugeTemperatureR");
        tempGaugeL(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        tempGaugeR(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function attitude (){
        createSpan(gaugeType);
    }
    function turn_coordinator()    {
        createSpan(gaugeType);
    }  
    function heading()    {
        createSpan(gaugeType);
    }
    function altimeter(){
        createSpan(gaugeType);
    }
    function variometer(){
        createSpan(gaugeType);
    }
    function gaugeVariometer(){
         createCanvas(gaugeType);
         variometreGauge(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuel1(){
        createCanvas(gaugeType);
        gaugeFuel(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelL(){
        createCanvas(gaugeType);
        fuelGaugeL(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelR(){
        createCanvas(gaugeType);
        fuelGaugeR(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
    }
    function gaugeFuelD(){
        createCanvas(gaugeType);
        createCanvas1(gaugeId);        
        $("#" + gaugeType).attr("id", "gaugeFuelL");
        $("#gaugeDivL" + gaugeId).attr("class", "demiContainer-canvasL");
        $("#canvas1"+gaugeId).attr("id","gaugeFuelR");
        fuelGaugeL(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
        fuelGaugeR(tabGrad, unit, gradMin, gradMax, affPosVert, affPostHor, arc11, arc12, arc21, arc22, arc31, arc32);
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


