/**
 * Created by kaihe on 3/10/17.
 * Supercharged by longlong on 3/11/17
 **/

//general set up
var express = require('express');
var app = express();
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config/aws.json');
var Elasticsearch = require('aws-es');
var bodyParser = require('body-parser');
var Twit = require('twit')
var credentials = require('./config/twitter-keys').twitterKeys;
var esCredentials = require('./config/es-keys').esKeys;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var es = new Elasticsearch(esCredentials);
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'search-hw2-tdhgyz7ioes5cxy3auanx3cbtq.us-east-1.es.amazonaws.com/'
});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});



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
        track:['rich','power','wall','technology','america','strong','storm','live','like','music','google','weather','sports'],
        //locations: [-134.91,25.76,-66.4,49.18]
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
            if (tweet.coordinates != null && tweet.lang == "en") {
                es.bulk({
                    index: 'new_tweets',
                    type: 'tweets',
                    body: [
                        {"index": {"_index": "new_tweets", "_type": "tweets"}},
                        tweet]
                }, function (error, response) {
                    if (error) {
                        console.log("error: ", error);
                    }
                    else {
                        console.log("new data created");//, response.items
                    }
                });

                var params = {
                    DelaySeconds: 10,
                    MessageAttributes: {
                        "Title": {
                            DataType: "String",
                            StringValue: "The Whistler"
                        },
                        "Author": {
                            DataType: "String",
                            StringValue: "John Grisham"
                        },
                        "WeeksOn": {
                            DataType: "Number",
                            StringValue: "6"
                        }
                    },
                    MessageBody: tweet.text,
                    QueueUrl: "https://sqs.us-east-1.amazonaws.com/700275664603/TwittTrends"
                };

                sqs.sendMessage(params, function(err, data) {
                    if (err) {
                        console.log("Error", err);
                    } else {
                        console.log("Success", data.MessageId);
                    }
                });

                var tw_info = {};
                tw_info.location = {
                    //"coordinates" : [lng, lat]
                    lat: tweet.coordinates.coordinates[1],
                    lng: tweet.coordinates.coordinates[0],
                };
                socket.broadcast.emit("twitter-stream", tw_info);
                socket.emit('twitter-stream', tw_info);
            }
        })
    });

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

    // handle search request
    socket.on('search', function (keyword) {
        client.search({
            index: 'new_tweets',
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
