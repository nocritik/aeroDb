/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
import { addInstrument } from "./components/addGauge.js";
// CORRECTION BUG: Utiliser une boucle for standard au lieu de for...in
// pour éviter d'itérer sur les propriétés non-numériques de localStorage
for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    // Vérifier que la clé est un ID numérique de jauge (pas une autre donnée)
    var keyAsNumber = parseInt(key, 10);
    if (isNaN(keyAsNumber) || key !== String(keyAsNumber)) {
        continue; // Ignorer les clés non-numériques
    }

    var LsInst = localStorage.getItem(key);
    var gaugeId = key;

    try {
        var myInst = JSON.parse(LsInst);

        if (myInst !== null && myInst.instrument) {
            var instrument = myInst["instrument"];
            var tabGrad = myInst["gradValue"];
            var unit = myInst["unité"];
            var gradMin = myInst["graduationMin"];
            var gradMax = myInst["graduationMax"];
            var affPosVert = myInst["positionVerticalAfficheur"];
            var affPosHor = myInst["positionHorizontalAfficheur"];
            var arc11 = myInst["arcJauneMin"];
            var arc12 = myInst["arcJauneMax"];
            var arc21 = myInst["arcVertMin"];
            var arc22 = myInst["arcVertMax"];
            var arc31 = myInst["arcRougeMin"];
            var arc32 = myInst["arcRougeMax"];

            addInstrument(gaugeId, instrument, tabGrad, unit, gradMin, gradMax, affPosVert, affPosHor, arc11, arc12, arc21, arc22, arc31, arc32);
        }
    } catch (e) {
        console.warn('Erreur parsing localStorage key ' + key + ':', e);
    }
}
 


