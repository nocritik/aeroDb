/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
import { addInstrument } from "./components/addGauge.js";

function saveNewGauge(){

    var instrument = $("#listeInstrument").val();
    var unit = $("#listeUnite").val();
    var gradMin = $("#gradMin").val();
    var gradMax = $("#gradMax").val();
    var affPosVert = $("#listePosVert").val();
    var affPosHor = $("#listePosHoriz").val();
    var arc11 = $("#arcJauneMin").val();
    var arc12 = $("#arcJauneMax").val();
    var arc21 = $("#arcVertMin").val();
    var arc22 = $("#arcVertMax").val();
    var arc31 = $("#arcRougeMin").val();
    var arc32 = $("#arcRougeMax").val();

    // CORRECTION BUG: Utiliser localStorage pour trouver le prochain ID disponible
    // L'ancienne méthode basée sur les éléments DOM était fragile
    var maxId = -1;
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        // Vérifier si la clé est un nombre (ID de jauge)
        var keyAsNumber = parseInt(key, 10);
        if (!isNaN(keyAsNumber) && keyAsNumber > maxId) {
            maxId = keyAsNumber;
        }
    }
    var newId = maxId + 1;
    //*************** genere les graduations intermediaire *************    
var tabGrad = creatGradu(instrument,gradMin,gradMax);
           
    //******************************************************************
    //************************Crée 'objet json de l'instrument pour la savgarde*************************************
     
    
    var MyInst =  JSON.stringify ({"instrument":instrument,
                                   "gradValue" : tabGrad,
                                   "unité": unit,
                                   "graduationMin":gradMin,
                                   "graduationMax":gradMax,
                                   "positionVerticalAfficheur":affPosVert,
                                   "positionHorizontalAfficheur":affPosHor,
                                   "arcJauneMin":arc11,
                                   "arcJauneMax":arc12,
                                   "arcVertMin":arc21,
                                   "arcVertMax":arc22,
                                   "arcRougeMin":arc31,
                                   "arcRougeMax":arc32
                                  }); 
    //******************************************************************
    localStorage.setItem(newId,MyInst); // enregistrement instrument dans localStorage
    //console.log("btn save !");
    addInstrument(newId,instrument,tabGrad,unit,gradMin,gradMax,affPosVert,affPosHor,arc11,arc12,arc21,arc22,arc31,arc32);//creation du nouvel instrument


};

// Exposer la fonction sur window pour qu'elle soit accessible depuis event.js (non-module)
window.saveNewGauge = saveNewGauge;

