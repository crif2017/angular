var ws = require('nodejs-websocket');
var clients = [];

// creer le server
var server = ws.createServer(function ( con ) {
	
	// ajouter le client courant à la liste des clients
	clients.push(con);
	
	// envoie du message de bienvenue
	con.sendText(JSON.stringify({user: "Server", msg: "Bienvenue !"}));
	
	// affecter l'evenement de reception de texte
	con.on('text', function ( str ) {
		
		// envoie du texte à tous les clients
		for ( var i = 0; i < clients.length; i++ ) {
			clients[i].sendText(str);
		}
	});
	
	// affecter l'evenement de fermeture de connection
	con.on('close', function () {
		
		// suppression du client deconnecté de la liste des clients
		for ( var i = 0; i < clients.length; i++ )
			if ( con === clients[i] )
				clients.splice(i, 1);
			
	});
});

server.listen(8000);