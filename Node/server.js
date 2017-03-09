// var express = require('express');
// var utility = require('utility');
// var superagent = require('superagent');
// var cheerio = require('cheerio');

// var app = express();

// app.get('/', function(req, res, next){
// 	superagent.get('https://cnodejs.org/').end(function(err, sres){
// 		if (err) return next(err);
// 		var $ = cheerio.load(sres.text);
// 		var items = [];
// 		$('#topic_list .topic_title').each(function (idx, element) {
//         	var $element = $(element);
//         	items.push({
//           		title: $element.attr('title'),
//           		href: $element.attr('href')
//         	});
//       	});
// 		res.send(items);
// 	});
// });

// app.listen(3000, function(){
// 	console.log('app is listening at 3000 port');
// });

var http = require("http");
var url = require("url");
var port = process.env.PORT || 3000;

function start(route, handle) {
	function onRequest(request, response) {
		var postData = "";
		var pathname = url.parse(request.url).pathname;
		console.log("Request for " + pathname + " received");

		route(handle, pathname, response, request);
		// request.setEncoding("utf8");

		// request.addListener("data", function(postDataChunk) {
		// 	postData += postDataChunk;
		// 	console.log("Received POST datachunk " + postDataChunk);
		// });

		// request.addListener("end", function() {
		// 	route(handle, pathname, response, postData);
		// });


		// route(handle, pathname, response);

		// response.writeHead(200, {"Content-Type": "text/plain"});
		// var content = route(handle, pathname);
		// response.write(content);
		// response.end();
	}

	http.createServer(onRequest).listen(port);

	console.log("Server has started");
}

exports.start = start;
