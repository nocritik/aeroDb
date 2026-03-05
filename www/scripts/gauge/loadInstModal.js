/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function loadInstModal(){
    //debugger
    for(var i in localStorage) {
        var LsInst = localStorage.getItem(i);
        var myInst = JSON.parse(LsInst);
        if(myInst!==null){
            var instrument = myInst["instrument"];
             //$('#listeInstrument option[value=instrument]').prop('disabled', true); // pour jquery 1.6 et plus
             $('#listeInstrument option[value='+instrument+']').attr('disabled',"true");
        };
    };
};