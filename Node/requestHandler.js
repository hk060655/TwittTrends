var exec = require("child_process").exec;
var querystring = require("querystring");
var fs = require("fs");
var formidable = require("formidable");
var Elasticsearch = require('aws-es');

function start(response) {
	console.log("Request handler Start");

	fs.readFile("index.html", function(err, data) {
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(data);
		response.end();
	});
		

	// var body = '<html>' +
	// 	'<head>' +
	// 	'<meta http-equiv="Content-Type" content="text/html;' +
	// 	'charset=UTF-8" />' +
	// 	'</head>' +
	// 	'<body>' +
	// 	'<form action="/upload" enctype="multipart/form-data" method="post">' +
	// 	'<input type="file" name="upload">' +
	// 	'<input type="submit" value="Upload file" />' +
	// 	'</form>' +
	// 	'</body>' +
	// 	'</html>';

	// response.writeHead(200, {"Content-Type": "text/html"});
	// response.write(body);
	// response.end();

	// var content = "empty";

	// exec("find /", { timeout: 10000, maxBuffer: 20000*1024 }, function(error, stdout, stderr) {
	// 	response.writeHead(200, {"Content-Type": "text/plain"});
	// 	response.write(stdout);
	// 	response.end();
	// });

	// function sleep(milliSeconds) {
	// 	var startTime = new Date().getTime();
	// 	while (new Date().getTime() < startTime + milliSeconds);
	// }

	// sleep(10000);
	// return "Hello Start";
	//return content;
}

function display(response, request) {
	console.log("Request handler Display");

	// fs.readFile("map.html", function(err, data) {
	// 	response.writeHead(200, {"Content-Type": "text/html"});
	// 	response.write(data);
	// 	response.end();
	// });

	var res = "";

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
	      console.log("search error: "+error)
	    }
	    else {
	      console.log("--- Response ---");
	      console.log(response);
	      console.log("--- Hits ---");
	      response.hits.hits.forEach(function(hit){
	        console.log(hit);
	        res.concat(hit._source.user.location);
	      })
	    }
	});


	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(res);
	response.end();
}

// function upload(response, request) {
// 	console.log("Request handler Upload");

// 	var form = new formidable.IncomingForm();
// 	console.log("about to parse");
// 	form.parse(request, function(error, fields, files) {
// 		console.log("parse done");
// 		fs.rename(files.upload.path, "tmp/test.png", function(error) {
// 			if(error) {
// 				fs.unlink("tmp/test.png");
// 				fs.rename(files.upload.path, "tmp/test.png");
// 			}
// 		});
// 		response.writeHead(200, {"Content-Type": "text/html"});
// 		response.write("received image: <br/>");
// 		response.write("<img src='/show' />");
// 		response.end();
// 	})
	
// 	// return "Hello Upload";
// }

// function show(response) {
// 	console.log("Request handler show");
// 	response.writeHead(200, {"Content-Type": "image/png"});
// 	fs.createReadStream("tmp/test.png").pipe(response);
// }

exports.start = start;
exports.display = display;
// exports.upload = upload;
// exports.show = show;
