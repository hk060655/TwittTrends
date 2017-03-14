/**
 * Created by longlong on 3/10/17.
 */

var map,
    liveTweets;
var bird = "/public/twitter_bird.png";
function initMap() {
    var nwc = {lat: 40.8097609, lng: -73.9617941};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {lat: 37, lng: -95}
    });
    var marker = new google.maps.Marker({
        position: nwc,
        map: map
    });
    // liveTweets = new google.maps.MVCArray();
}



if (io !== undefined) {
    // Storage for WebSocket connections
    var socket = io.connect('http://localhost:8081/');

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

        //Now that we are connected to the server let's tell
        //the server we are ready to start receiving tweets.
        // socket.emit("start stream");
    });

    socket.on("being stopped", function () {
        alert("Stream being stopped! Click stream button to continue.");
    });
    socket.on("search results", function (res) {
        console.log(res.results);
        for (var i = 0; i < res.length; i++) {
            var loc = new google.maps.LatLng({
                "lng": res[i].coordinates.coordinates[0],
                "lat": res[i].coordinates.coordinates[1]
            });
            var marker = new google.maps.Marker({
                position: loc,
                map: map,
                icon: bird
            });
            map.addMarker(marker);
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
}
document.getElementById('endStream').onclick = function () {
    socket.emit("end stream");
}
