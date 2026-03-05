/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//************dessine un marqueur bleu avec popup sur la carte ************
function layerMarkerBase(mymap, base_ulm_url) {
    var layerBases = new L.layerGroup();

    var ulmIcon = L.icon({
        iconUrl: '../img/baseIcon.png',        
        iconSize: [38, 40],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76]

    });


    $.ajax({
        url: base_ulm_url,
        contenType: "application/json",
        success: function (response) {
            for (var i in response.features)
            {
               // var type = response.features[i].geometry.type;
                var coordinates1 = response.features[i].geometry.coordinates[0];
                var coordinates2 = response.features[i].geometry.coordinates[1];
                var coordinates = response.features[i].geometry.coordinates;
                //var id = response.features[i].id;
                var code = response.features[i].properties.code;
                var nom = response.features[i].properties.nom;
                //var label = response.features[i].properties.label;
                var info = response.features[i].properties.infobulle;

                var baseMarker = L.marker([coordinates2, coordinates1], {icon: ulmIcon}).addTo(layerBases);
                var popupContent = "Nom : " + nom + "<br>" +
                        "Code : " + code + "<br>" +
                        "Coordonnées : " + coordinates + "<br>" +
                        "Info : " + info
                        ;
                popupOptions = {maxWidth: 200};
                baseMarker.bindPopup(popupContent, popupOptions);
                //return (type,coordinates1,coordinates2,id,code,nom,label,info) ;
            }
        }

    });
    layerBases.clearLayers();
    layerBases.addTo(mymap);

}
