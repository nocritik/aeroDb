/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//window.onload = initMap(defaultLong,defaultLat);
//var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
//var baseLayer = L.tileLayer(osmUrl, {
//    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//    maxZoom: 18
//}).addTo(mymap);  

function initMap(defaultLong,defaultLat){

var mapBoxUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw';    
var attrMapBoxLayer = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, '+'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>';
var idLayer = 'mapbox.streets'; 

var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';                        
var attrOsmLayer = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'


//************initialisae la carte ************
var mymap = L.map('mapid').setView([defaultLong,defaultLat], 13);
		L.tileLayer(mapBoxUrl, {
			maxZoom: 18,
			attribution: attrMapBoxLayer,
			id: idLayer //juste pour mapBox !! rien pour les autres !!
		}).addTo(mymap);
 layerMarkerPlane(mymap, defaultLong, defaultLat) ;

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
console.log ("initialisation de la carte ! ");

return (mymap);
};