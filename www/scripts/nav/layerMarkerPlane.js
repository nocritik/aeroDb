/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function layerMarkerPlane(mymap, Long, Lat) {
    
    var layerMarkerPlane = new L.layerGroup();
    var planeIcon = L.icon({
        iconUrl: '../img/planeIcon.jpg',
        iconSize: [42, 46]
    });
    var planeMarker = L.marker([Long, Lat], {icon: planeIcon});
        planeMarker.addTo(layerMarkerPlane);
       //layerMarkerPlane.clearLayers();
        layerMarkerPlane.addTo(mymap);

};
