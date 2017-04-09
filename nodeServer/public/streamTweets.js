/**
 * Created by longlong on 3/10/17.
 */

var map,
    markers=[];
var blueBird = "/public/blue_bird.png";
var redBird = "/public/red_bird.png";
var greenBird = "/public/green_bird.png";
var bluePin = "/public/blue_pin.png";
var redPin = "/public/red_pin.png";
var greenPin = "/public/green_pin.png";

// var centerMarker;
var centerLng = 0;
var centerLat = 0;

function initMap() {
    // var nwc = {lat: 40.8097609, lng: -73.9617941};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: {lat: 25, lng: 157}
    });

    // map.addListener('click', function(e) {
    //     placeMarkerAndPanTo(e.latLng, map);
    //     centerLng = e.latLng.lng();
    //     centerLat = e.latLng.lat();
    // });
    //
    // function placeMarkerAndPanTo(latLng, map) {
    //     removeMarkers();
    //     if (centerMarker != null) centerMarker.setMap(null);
    //     centerMarker = new google.maps.Marker({
    //         position: latLng,
    //         map: map,
    //         icon: blue
    //     });
    //     //map.panTo(latLng);
    // }
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

        var Icon;

        if (tweet.senti === 'positive') {
            Icon = greenBird;
        } else if (tweet.senti === 'neutral') {
            Icon = blueBird;
        } else if (tweet.senti === 'negative') {
            Icon = redBird;
        }

        var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map,
            icon: Icon
        });
        setTimeout(function () {
            marker.setMap(null);
        }, 600);

    });

    // Listens for a success response from the nodeServer to
    // say the connection was successful.
    socket.on("connected", function (r) {
        //tell nodeServer we are ready to start receiving tweets.
        // socket.emit("start stream");
    });

    socket.on("being stopped", function () {
        alert("Stream being stopped! Click stream button to continue.");
    });
    socket.on("search results", function (res) {
        removeMarkers();

        for (var i = 0; i < res.results.length; i++) {

            // if ((centerMarker != null) && (Math.pow(centerLng - res.results[i].place.bounding_box.coordinates[0][1][0], 2) + Math.pow(centerLat - res.results[i].place.bounding_box.coordinates[0][1][1], 2) > 100))
            //     continue;

            // SNS
            // var geo = res.results[i].geo.replace(/'/g, '"');
            // geo = JSON.parse(geo);

            // Kafka
            var geo = res.results[i].geo;


            // console.log("**************" + res.results[i].senti)

            var loc = new google.maps.LatLng({
                // fix the structure, working now
                "lng": geo[1],
                "lat": geo[0]
            });

            var Icon;

            if (res.results[i].senti === 'positive') {
                Icon = greenPin;
            } else if (res.results[i].senti === 'neutral') {
                Icon = bluePin;
            } else if (res.results[i].senti === 'negative') {
                Icon = redPin;
            }

            markers[markers.length] = new google.maps.Marker({
                position: loc,
                map: map,
                icon: Icon
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
