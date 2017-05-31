/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function creatGradu(instrument,gradMin,gradMax){
    
    if(instrument==="gaugeVariometer"){
       var diviseur = 1;
    }else{
       diviseur = 20; 
    }
    var nbGrad =  gradMin;
        var tabGrad =[];
        var ech = nbGrad/diviseur;
        for(var i = ech ; i < 0 ; i++){
        var grad= diviseur*i; 
        tabGrad.push(grad);        
        }; 
        
    var nbGrad = gradMax ;        
        var ech = nbGrad/diviseur;
        for(var i = 0; i <= ech ; i++){
          var grad= diviseur*i; 
        tabGrad.push(grad);        
        };
    return tabGrad;    
};