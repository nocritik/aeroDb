/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function creatGradu(instrument, gradMin, gradMax) { // eslint-disable-line no-unused-vars
    gradMin = parseFloat(gradMin);
    gradMax = parseFloat(gradMax);

    var range = gradMax - gradMin;
    var targetTicks = 8;
    var rawStep = range / targetTicks;

    // Arrondir rawStep au "pas propre" le plus proche (1, 2, 5 × puissance de 10)
    var magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var normalized = rawStep / magnitude;
    var nice;
    if      (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    else                      nice = 10;
    var step = nice * magnitude;

    var tabGrad = [];
    var startI = Math.ceil(gradMin / step);
    var endI   = Math.floor(gradMax / step);
    for (var i = startI; i <= endI; i++) {
        // Math.round × 1000 / 1000 évite les flottants parasites (ex: 0.1+0.2)
        tabGrad.push(Math.round(step * i * 1000) / 1000);
    }

    return tabGrad;
};