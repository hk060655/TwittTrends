/**
 * Created by kaihe on 3/10/17.
 */

var express = require('express');
var app = express();
var Elasticsearch = require('aws-es');
var bodyParser = require('body-parser');

app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    console.log("Request handler Index");
    res.render('index');
})

app.get('/index', function (req, res) {
    console.log("Request handler Index");
    res.render('index');
})

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

app.set('portListen', process.env.PORT || 8081);

var server = app.listen(app.get('portListen'), function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port);
})
