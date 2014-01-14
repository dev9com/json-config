var nconf = require('nconf');
var http = require("http");
var url = require("url");

nconf.argv().env();

var configPath = nconf.get('CONFIG_PATH') || '../build';
var env = nconf.get('CONFIG_ENV') || 'prod';
var port = nconf.get('CONFIG_SERVER_PORT') || 8888;

var file = configPath + '/' + env + '/config.json';

console.log("\nConfig: Loading from " + file + "\n");

nconf.file('theconfig', {file: file});

var server = http.createServer(function(request, response) {
	if ( request.url === '/favicon.ico' ) {
	    response.writeHead(200, {'Content-Type': 'image/x-icon'} );
	} else {
		var pathname = url.parse(request.url).pathname;
		console.log(pathname);

		if ( pathname === "/" ) {
			response.writeHead(200, {"Content-Type": "application/json"});
			response.write(JSON.stringify(nconf.stores.theconfig.store));
		} else {
			var configPath = pathname.replace(/\//g, ':').substr(1);
			var configValue = nconf.get(configPath);

			if ( configValue ) {
				response.writeHead(200, {"Content-Type": "application/json"});
				response.write(JSON.stringify(nconf.get(configPath)));
			} else {
				response.writeHead(404);
			}
		}
	}
	response.end();
}).listen(port);

console.log("Server started on port " + port);