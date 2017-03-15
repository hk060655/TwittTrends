/**
 * Created by longlong on 3/10/17.
 */

var map,
    markers=[];
var bird = "/public/twitter_bird.png";
var blue = "/public/google-maps-gris-hi.png";

var centerMarker;
var centerLng = 0;
var centerLat = 0;

function initMap() {
    // var nwc = {lat: 40.8097609, lng: -73.9617941};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: 37, lng: -95}
    });

    map.addListener('click', function(e) {
        placeMarkerAndPanTo(e.latLng, map);
        centerLng = e.latLng.lng();
        centerLat = e.latLng.lat();
    });

    function placeMarkerAndPanTo(latLng, map) {
        removeMarkers();
        if (centerMarker != null) centerMarker.setMap(null);
        centerMarker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: blue
        });
        //map.panTo(latLng);
    }
}

function removeMarkers(){
    for(var i=0; i<markers.length; i++){
        markers[i].setMap(null);
    }
    markers=[];
}

if (io !== undefined) {
    // Storage for WebSocket connections
    var socket = io.connect();

    // This listens on the "twitter-steam" channel and data is
    // received everytime a new tweet is receieved.
    socket.on('twitter-stream', function (tweet) {

        //Add tweet to the map array.
        var tweetLocation = new google.maps.LatLng({
            "lng": parseFloat(tweet.location.lng),
            "lat": parseFloat(tweet.location.lat)
        });

        // liveTweets.push(tweetLocation);
        // console.log(liveTweets);

        var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map,
            icon: bird
        });
        setTimeout(function () {
            marker.setMap(null);
        }, 600);

    });

        // Listens for a success response from the server to
    // say the connection was successful.
    socket.on("connected", function (r) {
        //tell server we are ready to start receiving tweets.
        // socket.emit("start stream");
    });

    socket.on("being stopped", function () {
        alert("Stream being stopped! Click stream button to continue.");
    });
    socket.on("search results", function (res) {
        removeMarkers();

        for (var i = 0; i < res.results.length; i++) {

            if ((centerMarker != null) && (Math.pow(centerLng - res.results[i].place.bounding_box.coordinates[0][1][0], 2) + Math.pow(centerLat - res.results[i].place.bounding_box.coordinates[0][1][1], 2) > 100))
                continue;

            var loc = new google.maps.LatLng({
                // fix the structure, working now
                "lng": res.results[i].place.bounding_box.coordinates[0][1][0],
                "lat": res.results[i].place.bounding_box.coordinates[0][1][1]
            });

            markers[markers.length] = new google.maps.Marker({
                position: loc,
                map: map,
            });
        }

    });
}

document.getElementById('search').onclick = function () {
    var s = document.getElementById('select');
    var word = s.options[s.selectedIndex].value;
    // console.log("called search function");
    socket.emit("search", {key: word});
}
document.getElementById('startStream').onclick = function () {
    socket.emit("start stream");
    removeMarkers();
}
document.getElementById('endStream').onclick = function () {
    socket.emit("end stream");
}
