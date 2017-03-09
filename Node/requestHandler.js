var exec = require("child_process").exec;
var querystring = require("querystring");
var fs = require("fs");
var formidable = require("formidable");

function start(response) {
	console.log("Request handler Start");

	fs.readFile("map.html", function(err, data) {
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

function upload(response, request) {
	console.log("Request handler Upload");

	var form = new formidable.IncomingForm();
	console.log("about to parse");
	form.parse(request, function(error, fields, files) {
		console.log("parse done");
		fs.rename(files.upload.path, "tmp/test.png", function(error) {
			if(error) {
				fs.unlink("tmp/test.png");
				fs.rename(files.upload.path, "tmp/test.png");
			}
		});
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write("received image: <br/>");
		response.write("<img src='/show' />");
		response.end();
	})
	
	// return "Hello Upload";
}

function show(response) {
	console.log("Request handler show");
	response.writeHead(200, {"Content-Type": "image/png"});
	fs.createReadStream("tmp/test.png").pipe(response);
}

exports.start = start;
exports.upload = upload;
exports.show = show;