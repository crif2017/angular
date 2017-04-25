var ws = require('nodejs-websocket');
var clients = [];

console.log('Demarrage du serveur !');

function dateFormat ( date ) {
	return ("0" + date.getDate()).slice(-2) + '/' + 
		("0" + (date.getMonth() + 1)).slice(-2) + '/' + 
		date.getFullYear() + " " +
		("0" + date.getHours()).slice(-2) + ":" +
		("0" + date.getMinutes()).slice(-2) + ":" +
		("0" + date.getSeconds()).slice(-2);
};
		
// creer le server
var server = ws.createServer(function ( con ) {
	
	//console.log(con.socket);
	
	var first = true;
	var pseudo = '';
	
	console.log('Nouvelle connexion !');
	
	// ajouter le client courant à la liste des clients
	clients.push(con);
	
	// envoie du message de bienvenue
	con.sendText(JSON.stringify({date: dateFormat(new Date()), user: "Server", msg: "Bienvenue !"}));
	
	// affecter l'evenement de reception de texte
	con.on('text', function ( str ) {
		
		if ( first ) {
			
			first = false;
			pseudo = str;
			console.log('Utilisateur declaré : ' + pseudo + ' !');
			for ( var i = 0; i < clients.length; i++ ) {
				clients[i].sendText(JSON.stringify({date: dateFormat(new Date()), user: "Server", msg: "Connexion de l'utilisateur : " + pseudo}));
			}
			
			
		} else {
			
			
			
			var msgObj = JSON.parse(str);
			if ( msgObj.msg === '.exit' ) {
				console.log("Demande de fermeture du serveur.");
				con.sendText(JSON.stringify({date: dateFormat(new Date()), user: "Server", msg: "Vous êtes deconnecté"}));
				con.close();
				return;
				// for ( var i = 0; i < clients.length; i++ ) {
					// clients[i].socket.destroy();
				// }
				// server.close();
				// return;
			}
			
			console.log('Nouveau texte !');
			
			// envoie du texte à tous les clients
			for ( var i = 0; i < clients.length; i++ ) {
				clients[i].sendText(str);
			}
		}
	});
	
	// affecter l'evenement de fermeture de connection
	con.on('close', function () {
		
		console.log('Fermeture de connexion !');
		
		// suppression du client deconnecté de la liste des clients
		for ( var i = 0; i < clients.length; i++ )
			if ( con === clients[i] )
				clients.splice(i, 1);
		
		for ( var i = 0; i < clients.length; i++ ) {
				clients[i].sendText(JSON.stringify({date: dateFormat(new Date()), user: "Server", msg: "Deconnexion de l'utilisateur : " + pseudo}));
			}
		
	});
});

server.listen(8000);