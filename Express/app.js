var express = require('express');
var app = express();
var Elasticsearch = require('aws-es');
var bodyParser = require('body-parser');

app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
   res.send('Hello World');
})

app.get('/index', function (req, res) {
  console.log("Request handler Index");
  res.render('index');
})

app.post('/display', function (req, res) {
  console.log("Request handler Display");
  console.log("Parsed: " + req.body.selection);
    var result = [];

    elasticsearch = new Elasticsearch({
        accessKeyId: 'AKIAJ7OSXNTJ2ZYVZ5XQ',
        secretAccessKey: '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',
        service: 'es',
        region: 'us-east-1',
        host: 'search-test-off63ohnto3svkei2nbfv3oyj4.us-east-1.es.amazonaws.com'
    });


    elasticsearch.search({
        index: 'tweets_test',
        type: 'tweets',
        body: {
            query: {
                match: { "text": "great" }
            },
        }
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
                result.push(hit._source.user.location);
            })
        }
        console.log("result = " + result);
        res.render('display', {locs: result});
    });

    // console.log(searched);
    // console.log(typeof searched);

    // console.log(result);
    // res.send(result);
    // res.render('display');
})

var server = app.listen(3000, function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Example app listening at http://%s:%s", host, port);
})