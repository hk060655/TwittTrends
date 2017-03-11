/**
 * Created by longlong on 3/10/17.
 */

var nwc = {lat: 40.8097609, lng: -73.9617941};
var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 5,
    center: {lat: 37, lng: -95}
});
var marker = new google.maps.Marker({
    position: nwc,
    map: map
});
var liveTweets = new google.maps.MVCArray();


if(io !== undefined) {
    // Storage for WebSocket connections
    var socket = io.connect('http://localhost:8081/');

    // This listens on the "twitter-steam" channel and data is
    // received everytime a new tweet is receieved.
    socket.on('twitter-stream', function (data) {

        //Add tweet to the heat map array.
        var tweetLocation = new google.maps.LatLng(location.location.lng,location.location.lat);
        liveTweets.push(tweetLocation);

        //Flash a dot onto the map quickly
        var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map,
        });
        setTimeout(function(){
            marker.setMap(null);
        },600);

    });

    // Listens for a success response from the server to
    // say the connection was successful.
    socket.on("connected", function(r) {

        //Now that we are connected to the server let's tell
        //the server we are ready to start receiving tweets.
        socket.emit("start stream");
    });
}