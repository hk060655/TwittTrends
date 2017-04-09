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
var Twit = require('twit');
var credentials = require('./config/twitter-keys').twitterKeys;
var esCredentials = require('./config/es-keys').esKeys;
var ibmKeys = require('./config/ibm-keys').ibmKeys;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var es = new Elasticsearch(esCredentials);
var elasticsearch = require('elasticsearch');
var kafka = require('kafka-node');

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
    'username': ibmKeys.username,
    'password': ibmKeys.password,
    'version_date': '2017-02-27'
});

var intervalId;


var es_url = esCredentials.host;
var client = new elasticsearch.Client({
    host: es_url
});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var sns = new AWS.SNS({apiVersion: '2010-03-31'});

var Producer = kafka.Producer;

client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 5000
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
        track: ['the', 'hate', 'love', 'storm', 'live', 'like', 'music', 'whatever', 'weather', 'sad'],
        //locations: [-134.91,25.76,-66.4,49.18]
    });

app.set('view engine', 'pug');
app.use(bodyParser.json({type: 'text/plain'}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text({defaultCharset: 'utf-8'}));
app.set('portListen', process.env.PORT || 8081);
app.use("/public", express.static(__dirname + '/public'));

//start nodeServer
server.listen(process.env.PORT || 8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});


//Create web sockets connection.
io.sockets.on('connection', function (socket) {
    socket.on("start stream", function () {
        console.log('Client connected !');
        stream.start();


        stream.on('tweet', function (tweet) {
            if (tweet.coordinates != null && tweet.lang == "en") {

                // console.log("------------1----------" + tweet);

                // SQS
                // var params = {
                //     DelaySeconds: 10,
                //     MessageAttributes: {
                //         "ID": {
                //             DataType: "String",
                //             StringValue: tweet.id_str
                //         },
                //         "geo": {
                //             DataType: "String",
                //             StringValue: JSON.stringify(tweet.geo.coordinates)
                //         }
                //     },
                //     MessageBody: tweet.text,
                //     // QueueUrl: "https://sqs.us-east-1.amazonaws.com/700275664603/TwittTrends"
                //     QueueUrl: "https://sqs.us-east-1.amazonaws.com/158318011312/twit_trend"
                // };
                //
                // sqs.sendMessage(params, function(err, data) {
                //     if (err) {
                //         console.log("Error", err);
                //     } else {
                //         console.log("Success", data.MessageId);
                //     }
                // });

                // Kafka
                //create producer
                var kafkaClient = new kafka.Client('localhost:2181');
                var producer = new Producer(kafkaClient);
                console.log("------------got a tweet----------");
                var payloads = [
                    {
                        topic: 'tweets', messages: JSON.stringify({
                        "text": tweet.text,
                        "geo": tweet.geo.coordinates
                    })
                    },
                ];

                producer.on('ready', function () {
                    producer.send(payloads, function (err, data) {
                        // console.log(data);
                        console.log('-----------------kafka is working-----------------');
                    });
                });

                producer.on('error', function (err) {
                    console.log("error:", err);
                });


                var parameters = {
                    'text': tweet.text,
                    'features': {
                        'sentiment': {}
                    }
                };

                natural_language_understanding.analyze(parameters, function (err, response) {
                    if (err)
                        console.log('error:', err);
                    else
                        var tw_info = {};
                    tw_info.location = {
                        //"coordinates" : [lng, lat]
                        lat: tweet.coordinates.coordinates[1],
                        lng: tweet.coordinates.coordinates[0],
                    };
                    // console.log("----------" + response.sentiment.document.label);
                    tw_info.senti = response.sentiment.document.label;
                    socket.broadcast.emit("twitter-stream", tw_info);
                    socket.emit('twitter-stream', tw_info);
                });

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
        clearInterval(intervalId);
        intervalId = setInterval(function search() {
            client.search({
                index: 'test_tweets',
                type: 'tweets',
                size: 20,
                body: {
                    query: {
                        match: {"text": keyword.key},
                    }
                }
            }).then(function (resp) {
                var hits = resp.hits.hits;
                // console.log("hits-----------------", hits, hits.length);
                var res = [];
                for (var i = 0; i < hits.length; i++) {
                    res[i] = hits[i]._source;
                }
                socket.emit("search results", {results: res});
                console.log("search results sent to client");
            }, function (err) {
                console.log(err);
            });
            return search;
        }(), 3000);
    });
    //
});

//index route
app.get('/', function (req, res) {
    console.log("Request handler Index");
    res.render('index', {scripts: ['/socket.io/socket.io.js', '/public/streamTweets.js']}); //'jquery.min.js',
});

//index route
app.get('/index', function (req, res) {
    console.log("Request handler Index");
    res.render('index', {scripts: ['/socket.io/socket.io.js', '/public/streamTweets.js']});
});

//got notification from sns
app.use('/sns', function (req, res) {
    // SNS doesn't care about our response as long as it comes
    // with a HTTP statuscode of 200
    res.end('OK');

    var msgType = req.get('x-amz-sns-message-type');

    if (msgType === 'SubscriptionConfirmation') {
        var token = req.body.Token;
        var topicArm = req.body.TopicArn;
        // console.log(token);
        // console.log(topicArm);
        sns.confirmSubscription({
            Token: token,
            TopicArn: topicArm
        }, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });
    } else if (msgType === 'Notification') {
        // That's where the actual messages will arrive
        var id = req.body.MessageId;
        var tweet = req.body.Message;
        // console.log("--------------2--------------" + (typeof JSON.parse(tweet)));
        // console.log("--------------2--------------" + JSON.parse(tweet).text);
        es.bulk({
            index: 'test_tweets',
            type: 'tweets',
            body: [
                {"index": {"_index": "test_tweets", "_type": "tweets"}},
                JSON.parse(tweet)]
        }, function (error, response) {
            if (error) {
                console.log("error: ", error);
            }
            else {
                console.log("new data created");//, response.items
            }
        });
    }
});