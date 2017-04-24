var ws = require("nodesjs-websocket");
ws.createServer(function ( con ) {
		
	con.sendText(JSON.stringify({
		user: "Server", 
		date: new Date(), 
		msg: 'BIENVENUE SUR LE SERVEUR'
	}));
		
});