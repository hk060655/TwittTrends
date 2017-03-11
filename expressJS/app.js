/**
 * Created by kaihe on 3/10/17.
 * Supercharged by longlong on 3/11/17
 **/

//general set up
var express = require('express');
var app = express();
var Elasticsearch = require('aws-es');
var bodyParser = require('body-parser');
var Twit = require('twit')
var credentials = require('./config/twitter-keys').twitterKeys;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('portListen', process.env.PORT || 8081);
app.use("/public", express.static(__dirname + '/public'));

server.listen(process.env.PORT || 8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
})


//create new stream-tweets instance
var T = new Twit(credentials);

var stream = T.stream('statuses/filter', {track:['rich','power','wall','trump'],locations: [-134.91,25.76,-66.4,49.18]})

//Create web sockets connection.
io.sockets.on('connection', function (socket) {
    socket.on("start stream", function() {
        console.log('Client connected !');
        stream.start();
        stream.on('tweet', function (tweet) {
            if (tweet.coordinates!=null) {
                console.log(tweet); // Do awesome stuff with the results here

                var tw_info = {};
                tw_info.location = {
                    lat : tweet.coordinates.coordinates[1],
                    lng : tweet.coordinates.coordinates[0],
                };
                //send out to web sockets
                socket.broadcast.emit("twitter-stream", tw_info);
                //Send out to web sockets channel.
                socket.emit('twitter-stream', tw_info);
            }
        })
    });

    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");

    socket.on('disconnect', function() {
        console.log('Client disconnected !');
        stream.stop();

    });
});


//index route
app.get('/', function (req, res) {
    console.log("Request handler Index");
    res.render('index',{scripts: ['/socket.io/socket.io.js','/public/streamTweets.js']}); //'jquery.min.js',
})

//index route
app.get('/index', function (req, res) {
    console.log("Request handler Index");
    res.render('index',{scripts: ['/socket.io/socket.io.js','/public/streamTweets.js']});
})


//display page route
app.post('/display', function (req, res) {
    console.log("Request handler Display");
    console.log("Parsed: " + req.body.selection);
    var result = [];
    var long = [];
    var lat = [];
    // var base1 = 5;
    // var base2 = 5;
    // var count = 0;

    elasticsearch = new Elasticsearch({
        accessKeyId: 'AKIAJ7OSXNTJ2ZYVZ5XQ',
        secretAccessKey: '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',
        service: 'es',
        region: 'us-east-1',
        host: 'search-test-off63ohnto3svkei2nbfv3oyj4.us-east-1.es.amazonaws.com'
    });


    elasticsearch.search({
        index: 'geo_tweets',
        type: 'tweets',
        body: {
            size: 3000,
            query: {
                match: { "text": req.body.selection },
            },
        },
    },function (error, response,status) {
        if (error){
            console.log("search error: "+error);
        }
        else {
            console.log("--- Response ---");
            console.log("--- Hits ---");
            response.hits.hits.forEach(function(hit){
                console.log(hit._source.user.location);
                console.log(typeof hit._source.user.location);
                if (hit._source.user.location != null) result.push(hit._source.user.location);
                console.log("box = " + hit._source.place.bounding_box.coordinates[0][0]);
                long.push(hit._source.place.bounding_box.coordinates[0][1][0]);
                lat.push(hit._source.place.bounding_box.coordinates[0][1][1]);
            })
        }
        console.log("result = " + result);
        // res.render('display', {num1: 37, num2: -95});
        res.render('display', {longs: JSON.stringify(long), lats: JSON.stringify(lat)});//{locs: JSON.stringify(result)});
    });

    // console.log(searched);
    // console.log(typeof searched);

    // console.log(result);
    // res.send(result);
    // res.render('display');
})



