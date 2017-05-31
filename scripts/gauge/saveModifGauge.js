/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function saveModifGauge(idGauge){
     for(var i in localStorage) {
        var LsInst = localStorage.getItem(i);
        var myInst = JSON.parse(LsInst);
        if(myInst!==null){
            var instrument = myInst["instrument"];
             //$('#listeInstrument option[value=instrument]').prop('disabled', true); // pour jquery 1.6 et plus
             $('#listeInstrument option[value='+instrument+']').attr('disabled',false);
        };
    };
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
    localStorage.setItem(idGauge,MyInst); // enregistrement instrument dans localStorage
   //debugger
    addInstrument(idGauge,instrument,tabGrad,unit,gradMin,gradMax,affPosVert,affPosHor,arc11,arc12,arc21,arc22,arc31,arc32);//creation du nouvel instrument  
     
    
};


