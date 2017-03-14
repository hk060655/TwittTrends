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
var esCredentials = require('./config/es-keys').esKeys;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var es = new Elasticsearch(esCredentials);


/*
    Trying another package here
 */
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'search-test-off63ohnto3svkei2nbfv3oyj4.us-east-1.es.amazonaws.com/'
});

client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 3000
}, function (error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});


//create new stream-tweets instance
var T = new Twit(credentials);
var stream = T.stream(
    'statuses/filter', {
        track:['rich','power','wall','trump'],
        locations: [-134.91,25.76,-66.4,49.18]
})

app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('portListen', process.env.PORT || 8081);
app.use("/public", express.static(__dirname + '/public'));

//start server
server.listen(process.env.PORT || 8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
})


//Create web sockets connection.
io.sockets.on('connection', function (socket) {
    socket.on("start stream", function () {
        console.log('Client connected !');
        stream.start();
        stream.on('tweet', function (tweet) {
            if (tweet.coordinates != null) {
                // console.log(tweet); // Do awesome stuff with the results here

                es.bulk({
                    index: 'geo_tweets',
                    type: 'tweets',
                    body: [
                        {"index": {"_index": "geo_tweets", "_type": "tweets"}},
                        tweet]
                }, function (error, response) {
                    if (error) {
                        console.log("error: ", error);
                    }
                    else {
                        console.log("new data created");//, response.items
                    }
                });

                var tw_info = {};
                tw_info.location = {
                    //"coordinates" : [lng, lat]
                    lat: tweet.coordinates.coordinates[1],
                    lng: tweet.coordinates.coordinates[0],
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

    socket.on('end stream', function () {
        console.log('Client stopped stream !');
        stream.stop();
        socket.emit("being stopped");
    });

    socket.on('disconnect', function () {
        console.log('Client disconnected !');
        stream.stop();
        socket.emit("being stopped");
    });

    /*this one does not work..
    socket.on('search', function (keyword) {
        console.log('Client start searching !');
        es.search({
            index: 'geo_tweets',
            type: 'tweets',
            body: {
                size: 1000,
                query: {
                    match: {"text": keyword.key},
                },
            },
        }, function (error, response) {
            // if (error) {
            //     console.log("search error: " + error);
            // }
            // else {
                console.log("--- Response1 ---");
            console.log(response);
            if (response==null) return;
            res = []
            for (var hit in response.hits.hits) {

                if (hit._source.coordinates != null) {
                    console.log(hit);
                    res.push(hit._source);
                }
            }
            socket.emit("search results", {results: response});
            console.log("search results sent to client");
        });
    });//this one does not work..
    */

    // wait a second
    socket.on('search', function (keyword) {
        client.search({
            index: 'geo_tweets',
            type: 'tweets',
            size: 1000,
            body: {
                query: {
                    match: {"text": keyword.key},
                }
            }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            console.log(hits,hits.length);
            var res = [];
            for (var i = 0; i < hits.length; i++) {
                res[i] = hits[i]._source;
            }
            socket.emit("search results", {results: res});
            console.log("search results sent to client");
        }, function (err) {
            console.log(err);
        })
    });
    //
});
// });



//index route
app.get('/', function (req, res) {
    console.log("Request handler Index");
    res.render('index', {scripts: ['/socket.io/socket.io.js', '/public/streamTweets.js']}); //'jquery.min.js',
})

//index route
app.get('/index', function (req, res) {
    console.log("Request handler Index");
    res.render('index', {scripts: ['/socket.io/socket.io.js', '/public/streamTweets.js']});
})


//display page route
app.post('/display', function (req, res) {
    console.log("Request handler Display");
    console.log("Parsed: " + req.body.selection);
    var long = [];
    var lat = [];
    var result = [];

    es.search({
        index: 'geo_tweets',
        type: 'tweets',
        body: {
            size: 3000,
            query: {
                //@todo beter way to search? here only selected trump but some records may not have coordinates
                match: {"text": req.body.selection},
            },
        },
    }, function (error, response) {
        if (error) {
            console.log("search error: " + error);
        }
        else {
            // console.log("--- Response ---");
            // console.log("--- Hits ---");

            for (var hit in response.hits.hits) {
                // console.log(hit);
                if (hit._source.coordinates != null) {
                    // console.log("Geo location fetched: " + hit._source.coordinates.coordinates);
                    long.push(hit._source.coordinates.coordinates[0]);
                    lat.push(hit._source.coordinates.coordinates[1]);
                }
            }
        }

        res.render('display', {longs: JSON.stringify(long), lats: JSON.stringify(lat)});//{locs: JSON.stringify(result)});
    });

    // console.log(searched);
    // console.log(typeof searched);

    // console.log(result);
    // res.send(result);
    // res.render('display');


})
