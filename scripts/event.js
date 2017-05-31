/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//******* Ajout instrument : appel modal ***********
$('#addInstModal').on('shown.bs.modal', function () {
    for (var i in localStorage) {
        var LsInst = localStorage.getItem(i);
        var myInst = JSON.parse(LsInst);
        if (myInst !== null) {
            var instrument = myInst["instrument"];
            //$('#listeInstrument option[value=instrument]').prop('disabled', true); // pour jquery 1.6 et plus
            $('#listeInstrument option[value=' + instrument + ']').attr('disabled', "true");
        }
        ;
    }
    ;
});
//****************************************************************  
//    
function TouchSpinValue(p, p1) {
    $("input[name='" + p + "']").TouchSpin({
        min: -100,
        max: 350,
        step: 5,
        maxboostedstep: 1,
        prefix: p1

    });
}
//    
//******* Ajout instrument : boutton +/- graduations***************
TouchSpinValue("gradMin", "Min");
TouchSpinValue("gradMax", "Max");
//****************************************************************   

//******* Ajout arc 1 : boutton +/- graduations***************
TouchSpinValue("arcJauneMin", "Min");
TouchSpinValue("arcJauneMax", "Max");
//****************************************************************  

//******* Ajout arc 2 : boutton +/- graduations***************
TouchSpinValue("arcVertMin", "Min");
TouchSpinValue("arcVertMax", "Max");

//****************************************************************

//******* Ajout arc 3 : boutton +/- graduations***************
TouchSpinValue("arcRougeMin", "Min");
TouchSpinValue("arcRougeMax", "Max");

//****************************************************************
//
//***********************boutton Save*******************************
$("#btnSave").click(function () {
    var modalStatut = $(this).attr("data-info");
    var gaugeId = $("#idGauge").val(); //stock id de l'element selectionné dans input caché
//debugger
    switch (modalStatut) {
        case "save":
            saveNewGauge();
            break;
        case "modif":
            saveModifGauge(gaugeId);
            break;
        default:
            alert("Erreur d'enregistrement !!");
    };
    $("body").load("../partial/gauge_page.html");
});
//****************************************************************

//***********************boutton Save*******************************
$("#btnSuppr").click(function () {
    var gaugeId = $("#idGauge").val(); //recupere id de l'element selectionné dans input caché    
    localStorage.removeItem(gaugeId);
    $("body").load("../partial/gauge_page.html");
});
//****************************************************************

//***********************boutton menu flottant *******************************
$(function () {
    $("#btn_fleche_menu").click(function () {
        $("#div_menu").toggleClass("div_menu_big");
        $("#btn_fleche_menu").toggleClass("btn_fleche_menu_rotat");

    });
});
//**************************************************************** 
//  
//***********************boutton home menu flottant *******************************
$(function () {
    $("#btn_home").click(function () {
        window.location = "../index.html";
    });
});
//****************************************************************  
//***********************boutton map menu flottant *******************************
$(function () {
    $("#btn_map").click(function () {
        window.location = "nav_page.html";
        
    });
});
//****************************************************************  
//***********************boutton map menu flottant *******************************
$(function () {
    $("#btn_instr").click(function () {
        window.location = "gauge_page.html";
    });
});
//****************************************************************  
 $(document).ready(function() {
     var defaultLong = 43.7079321;
     var defaultLat = 3.864752; 
   var mymap = initMap(defaultLong,defaultLat);

//***********************boutton map menu flottant *******************************
$(function () {
    $("#btn_search").click(function () {
         var base_ulm_url = "../data/base_ulm.json";          
         layerMarkerBase(mymap,base_ulm_url);
    });
});
//****************************************************************  
});