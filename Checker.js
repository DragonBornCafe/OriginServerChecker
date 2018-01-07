var net = require('net');

var HOST = '192.168.253.128';
var PORT = 29555;
var i = 0;
var ID;
var connection;
var client = new net.Socket();
var server = require('websocket').server, http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
require('subdomain-router')
({
  host: 'origin-server-checker.herokuapp.com',
  subdomains:
  {
    '': 80,
    'ws': 8080,
  }
}).listen(process.env.PORT || 5000);
function parseHexString(str) { 
    var result = [];
    while (str.length >= 8) { 
        result.push(parseInt(str.substring(0, 8), 16));

        str = str.substring(8, str.length);
    }

    return result;
}
function connectToOrigin() {
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    const message = Buffer.from('000000cb057372010023636f6d2e6c696665666f726d2e6d61696e2e6e6574776f726b2e48616e647368616b65787000010000000160cc43a635740028352f4f315a6234586b56366a516b635879354f2b45364562634b64665233424e4e664b446c413d3d73720100146a6176612e6d6174682e426967496e746567657278720100106a6176612e6c616e672e4e756d6265727870fffffffffffffffffffffffefffffffeffffffff75720000025b42acf317f8060854e00200007870000000010178740000740006322e302e3132','hex');
    client.write(message);
    

});
}
client.on('data', function(data) {
    if (data.includes('Pong')) {
        console.log('Pong');
        clearInterval(ID);
        connection.sendUTF('Relay is up! '+'Latency: '+i.toString()+'ms');
    }
    else {
        const message = Buffer.from('0000002e05737201001e636f6d2e6c696665666f726d2e6d61696e2e6e6574776f726b2e50696e67787000000160cc5f37db','hex');
        client.write(message);
        console.log('Ping');
        ID = setInterval(function()
        {
         i++;
         if(i > 5000){
            connection.sendUTF('Relay is overloaded');
             clearInterval(ID);
         }
        }, 1);
    }
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
    client.destroy();
});

client.on('error', function() {
    connection.sendUTF('Relay is down');
    client.destroy();
});

var websocket = new server({
    httpServer: http.createServer().listen(8080)
});

websocket.on('request', function(request) {
    connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        console.log(message.utf8Data);
        if(message.utf8Data == "CheckServer"){
            connectToOrigin();
        }
    });

    connection.on('close', function(connection) {
        console.log('connection closed');
    });
}); 

connect().use(serveStatic(__dirname)).listen(80, function(){
    console.log('Server running on 80...');
});