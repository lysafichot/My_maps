/*jslint browser: true */
/*global google */

var initialize;

var calculate;

var createMarker;
var addMarker;
var fullscreen;
var callback;
var callmuseumrate;
var attraction;
var service;
var direction;
var markerclick = [];



function initMap() {
    "use strict";
    /* var myLatlng = {lat: -25.363, lng: 131.044}; */
    var panel = document.getElementById('panel');
    var mapOption = {
        center: {lat: 48.85703523304221, lng: 2.2977218544110656},
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [{
            featureType: 'poi.attraction',
            "elementType": "labels",
            "stylers": [{
                lightness: 100,
                visibility: "on",
                weight: '500px'
            }]
        }],
        disableDoubleClickZoom: false,
        fullscreenControl: true
    };

    var map = new google.maps.Map(document.getElementById('map'), mapOption);
    var infoWindow = new google.maps.InfoWindow();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            map.setCenter(pos);

            document.getElementById('mypos').addEventListener('click', function () {
                if (markerclick[0]) {
                    markerclick[0].setMap(null);
                }
                if (markerclick[1]) {
                    markerclick[1].setMap(null);
                }

                markerclick.length = 0;
                var marker = new google.maps.Marker({
                    position: pos,
                    label: '1',
                    map: map
                });
                markerclick[0] = marker;
                document.getElementById('origin').value = position.coords.latitude + ', ' + position.coords.longitude;
            });
        }, function () {
            infoWindow.setPosition(infoWindow, map.getCenter());
            infoWindow.setContent('Error: The Geolocation service failed.');
        });
    } else {
        infoWindow.setPosition(infoWindow, map.getCenter());
        infoWindow.setContent('Error: Your browser doesn\'t support geolocation.');
    }

    direction = new google.maps.DirectionsRenderer({
        map: map,
        panel: panel,
        draggable: true
    });

    var origin_auto = document.getElementById('origin');
    var dest_auto = document.getElementById('destination');

    var objectService = google.maps.places;

    var autocomplete = new objectService.Autocomplete(origin_auto);
    autocomplete.bindTo('bounds', map);
    var autocomplete_d = new objectService.Autocomplete(dest_auto);
    autocomplete_d.bindTo('bounds', map);

    var marker_d = new google.maps.Marker({
        map: map
    });
    marker_d.addListener('click', function () {
        infoWindow.open(map, marker_d);
    });


    autocomplete_d.addListener('place_changed', function () {
        infoWindow.close();
        var place = autocomplete_d.getPlace();
        if (!place.geometry) {
            return;
        }
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }

        marker_d.setPlace({
            placeId: place.place_id,
            location: place.geometry.location
        });
        marker_d.setVisible(true);

        infoWindow.setContent('<div><strong>' + place.name + '</strong><br>' + place.formatted_address);
        infoWindow.open(map, marker_d);
    });


    document.getElementById('direction').addEventListener('submit', function (e) {
        e.preventDefault();
        calculate();

        if (markerclick[0]) {
            markerclick[0].setMap(null);
        }
        if (markerclick[1]) {
            markerclick[1].setMap(null);
        }
        markerclick.length = 0;
    });


    addMarker = function (location, map, tab) {
        var labels;
        var labelIndex = 0;
        /* console.log(tab);*/
        if (tab.length === 0) {
            labels = '1';
            var marker1 = new google.maps.Marker({
                position: location,
                label: labels[(labelIndex + 1) % labels.length],
                map: map
            });
            document.getElementById('origin').value = marker1.position.lat() + ', ' + marker1.position.lng();
            tab.push(marker1);
        } else if (tab.length === 1) {
            labels = '2';
            var marker2 = new google.maps.Marker({
                position: location,
                label: labels[(labelIndex + 1) % labels.length],
                map: map
            });
            document.getElementById('destination').value = marker2.position.lat() + ', ' + marker2.position.lng();
            tab.push(marker2);

        } else {
            tab[0].setMap(null);
            tab[1].setMap(null);
            tab.length = 0;
        }
    };
    createMarker = function (place) {
        var markers = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        google.maps.event.addListener(markers, 'click', function () {
            infoWindow.setContent(place.name);
            infoWindow.open(map, markers);
        });
    };
    callback = function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var i = 0;
            while (i < results.length) {
                if (results[i].rating > 4.4) {
                    createMarker(results[i]);
                }
                i += 1;
            }

        }
    };
    callmuseumrate = function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var i = 0;
            while (i < results.length) {
                if (results[i].rating > 4.4) {
                    createMarker(results[i]);
                }
                i += 1;
            }
        }
    };
    calculate = function () {
        var markerArray = [];
        var origin = document.getElementById('origin').value;
        var destination = document.getElementById('destination').value;
        if (origin && destination) {
            var request = {
                origin: origin,
                destination: destination,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };

            var directionsService = new google.maps.DirectionsService();
            directionsService.route(request, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    direction.setDirections(response);
                    var myRoute = response.routes[0].legs[0];
                    var point;
                    var i = 0;
                    while (i < myRoute.steps.length) {
                        point = markerArray[i] || new google.maps.Marker();
                        point.setPosition(myRoute.steps[i].start_location);
                        i += 1;
                    }
                    attraction(response);
                }
            });
        }
    };

    attraction = function (response) {
        var chemin = response.routes[0].legs[0].steps;
        var i = 0;
        while (i <= chemin.length - 1) {
            service = new objectService.PlacesService(map);
            service.nearbySearch({
                location: chemin[i].start_location,
                radius: 5000,
                keyword: 'best view'
            }, callback);
            service.nearbySearch({
                location: chemin[i].start_location,
                radius: 5000,
                type: 'museum'
            }, callmuseumrate);
            i += 1;

        }

    };

    google.maps.event.addListener(map, 'click', function (event) {
        addMarker(event.latLng, map, markerclick);
    });


    fullscreen = function () {

        if (document.getElementById('map').style.height === '100%') {
            document.getElementById('map').style.height = '600px';
            document.getElementById('map').style.width = '800px';
        } else {
            document.getElementById('map').style.height = '100%';
            document.getElementById('map').style.width = '100%';
        }
    };

    document.addEventListener('fullscreenchange', function () {

        fullscreen();
    });
    document.addEventListener('mozfullscreenchange', function () {

        fullscreen();
    });
    document.addEventListener('webkitfullscreenchange', function () {

        fullscreen();
    });

}
