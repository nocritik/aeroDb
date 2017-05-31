/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
    //var LsLenght = localStorage.length;
    for(var i in localStorage) {
        var LsInst = localStorage.getItem(i);
        var gaugeId = i;        
        var myInst = JSON.parse(LsInst);
        
        if(myInst!==null){            
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
            
            addInstrument(gaugeId,instrument,tabGrad,unit,gradMin,gradMax,affPosVert,affPosHor,arc11,arc12,arc21,arc22,arc31,arc32); 
       };
    };
 


