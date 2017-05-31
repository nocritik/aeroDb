/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function modalModifInst(gaugeId){
         $('#btnSuppr').show(); //AFFICHE LE BTN SUPPR
         $('h4').html("Modifier Instrument");
         $("#btnSave").attr("data-info","modif");
         $("#idGauge").attr("value",gaugeId); // renvois l'id de l'elemnt selectionné dans input caché
         
        var instr = localStorage.getItem (gaugeId);
        var myInst = JSON.parse(instr);
        if(myInst!==null){            
            $("#listeInstrument").val(myInst["instrument"]);            
            $("#listeUnite").val(myInst["unité"]);
            $("#gradMin").val(myInst["graduationMin"]);
            $("#gradMax").val(myInst["graduationMax"]);
            $("#listePosVert").val(myInst["positionVerticalAfficheur"]);
            $("#listePosHoriz").val(myInst["positionHorizontalAfficheur"]);
            $("#arcJauneMin").val(myInst["arcJauneMin"]);
            $("#arcJauneMax").val(myInst["arcJauneMax"]);   
            $("#arcVertMin").val(myInst["arcVertMin"]);
            $("#arcVertMax").val(myInst["arcVertMax"]);
            $("#arcRougeMin").val(myInst["arcRougeMin"]);
            $("#arcRougeMax").val(myInst["arcRougeMax"]);           
        }; 
        
};
