/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
 

function loadBaseUlm(base_ulm_url){
    
    $.ajax({
        url:base_ulm_url,
        contenType :"application/json",
        success : function(response)    {
            
            for(var i in response.features)
            {
               var type = response.features[i].geometry.type;
               var coordinates1 = response.features[i].geometry.coordinates[0];
               var coordinates2 = response.features[i].geometry.coordinates[1];
               var id = response.features[i].id; 
               var code = response.features[i].properties.code;
               var nom = response.features[i].properties.nom;
               var label = response.features[i].properties.label;
               var info = response.features[i].properties.infobulle; 
               console.log(coordinates1,coordinates2);
               marker(coordinates2,coordinates1);
                
                //return (type,coordinates1,coordinates2,id,code,nom,label,info) ;
            }
        }
    });
};
    