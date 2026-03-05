
var maLong = 43.7079321;
var maLat = 3.864752;
var attr1Layer = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ';
var idLayer = 'mapbox.streets'; 

//************initialisae la carte ************
var mymap = L.map('mapid').setView([maLong,maLat], 13);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
			maxZoom: 18,
			attribution: attr1Layer +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: idLayer
		}).addTo(mymap);
                
//************dessine un marqueur bleu avec popup sur la carte ************
		L.marker([maLong,maLat]).addTo(mymap)
			.bindPopup("<b>Commantaire</b><br />I am a popup.").openPopup();
//************dessine un cercle sur la carte ************
		L.circle([maLong,maLat], 500, {
			color: 'red',
			fillColor: '#f03',
			fillOpacity: 0.5
		}).addTo(mymap).bindPopup("I am a circle.");
//************rdessine un polygone sur la carte ************
		L.polygon([
			[maLong, maLat],
			[maLong-0.05, maLat-0.04],
			[maLong+0.02, maLat-0.02]
		]).addTo(mymap).bindPopup("I am a polygon.");

//************renvoie les coordonnée du click sur la carte ************
var popup = L.popup();

function onMapClick(e) {
        popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(mymap);
}

mymap.on('click', onMapClick);
//**********************************************************************