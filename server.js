var ws = require('nodejs-websocket');
var clients = [];
var onCloseDelete = true;
var messages = [];

console.log('Demarrage du serveur !');

function dateFormat ( date ) {
	return ("0" + date.getDate()).slice(-2) + '/' + 
		("0" + (date.getMonth() + 1)).slice(-2) + '/' + 
		date.getFullYear() + " " +
		("0" + date.getHours()).slice(-2) + ":" +
		("0" + date.getMinutes()).slice(-2) + ":" +
		("0" + date.getSeconds()).slice(-2);
};
	

function broadcast ( cb ) {
	for ( var i = 0; i < clients.length; i++ )
		cb(clients[i].socket);
}

function sendMessage ( msg ) {
	broadcast(function ( con ) {
		con.sendText(JSON.stringify({
			type: 'msg',
			date: dateFormat(new Date()),
			user: "Server",
			msg: msg
		}));
	});
}

function sendUsers ( ) {
	broadcast(function ( con ) {
		con.sendText(JSON.stringify({
			type: 'users',
			list: clients.map(function ( e ) { return e.pseudo; })
		}));
	});
}

function deco ( con ) {
	con.sendText('Deconnexion');
	con.close();
}

function notifyDeco ( pseudo ) {
	sendMessage("Deconnexion de l'utilisateur : " + pseudo);
}

function logUser ( userData ) {
	// connexion à MySQL
	
	// recuperation de la ligne avec login et password identique
	
	// si pas de resultat retourner false
	// sinon retourner true.
}
	
// creer le server
var server = ws.createServer(function ( con ) {
	
	//console.log(con.socket);
	
	var first = true;
	var pseudo = '';
	
	console.log('Nouvelle connexion !');
	
	// envoie du message de bienvenue
	con.sendText(JSON.stringify({type: 'msg', date: dateFormat(new Date()), user: "Server", msg: "Bienvenue !"}));
	
	// envoyer la liste des messages
	for ( var i = 0; i < messages.length; i++ )
		con.sendText(messages[i]);
	
	
	// affecter l'evenement de reception de texte
	con.on('text', function ( str ) {
		
		if ( first ) {
			
			first = false;
			var tmp = JSON.parse(str);
			pseudo = tmp.pseudo;
			
			
			var ok = logUser(tmp);
			con.sendText(JSON.stringify({
					type: 'login',
					result: ok,
			}));
			if ( !ok ) {
				con.close();
				return;
			}
			
			
			console.log('Utilisateur declaré : ' + pseudo + ' !');
			
			sendMessage("Connexion de l'utilisateur : " + pseudo);
			// ajouter le client courant à la liste des clients
		
			clients.push({
				socket: con,
				pseudo: pseudo
			});
		
			sendUsers();
		
		} else {
			
			
			var msgObj = JSON.parse(str);
			if ( msgObj.msg === '.exit' ) {
				sendMessage("Fermeture du serveur.");
				server.close();
				server.socket.close();
				onCloseDelete = false;
				broadcast(function ( c ) { c.close(); c.socket.destroy(); });
				onCloseDelete = true;
				// con.close();
				// con.socket.destroy();
				clients = [];
				return;
			}
			else if ( msgObj.msg === '.quit' ) {
				con.close();
				con.socket.destroy();
				return;
			}
			
			console.log('Nouveau texte !');
			broadcast(function ( c ) { c.sendText(str); });
			messages.push(str);
			if ( messages.length > 10 )
				messages.splice(0, 1);
			
		}
	});
	
	// affecter l'evenement de fermeture de connection
	con.on('close', function () {
		
		console.log('Fermeture de connexion !');
		
		// suppression du client deconnecté de la liste des clients
		if ( onCloseDelete ) {
			
			for ( var i = 0; i < clients.length; i++ )
				if ( con === clients[i].socket )
					clients.splice(i, 1);
			
			notifyDeco(pseudo);
			sendUsers();
		
		}
		
	});
});

server.listen(8000);