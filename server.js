var ws = require('nodejs-websocket');
var clients = [];
var onCloseDelete = true;
var messages = [];

var db = require('node-mysql');
var DB = db.DB;
var BaseRow = db.Row;
var BaseTable = db.Table;

var dbCon;

	
var box = new DB({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'chat'
});

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

	
// creer le server
var server = ws.createServer(function ( con ) {
	
	//console.log(con.socket);
	
	var first = true;
	var pseudo = '';
	
	console.log('Nouvelle connexion !');
	
	
	// envoyer la liste des messages
	for ( var i = 0; i < messages.length; i++ )
		con.sendText(messages[i]);
	
	
	// affecter l'evenement de reception de texte
	con.on('text', function ( str ) {
		
		if ( first ) {
			
			first = false;
			var tmp = JSON.parse(str);
			pseudo = tmp.pseudo;
			
			
			if ( !tmp.register ) logUser(tmp, function ( isValidUser ) {
				
				
				
				con.sendText(JSON.stringify({
						type: 'login',
						result: isValidUser,
				}));
				if ( !isValidUser ) {
					con.close();
					return;
				}
				
				// envoie du message de bienvenue
				con.sendText(JSON.stringify({type: 'msg', date: dateFormat(new Date()), user: "Server", msg: "Bienvenue !"}));

				
				console.log('Utilisateur declaré : ' + pseudo + ' !');
				
				sendMessage("Connexion de l'utilisateur : " + pseudo);
				// ajouter le client courant à la liste des clients
			
				clients.push({
					socket: con,
					pseudo: pseudo
				});
			
				sendUsers();
			});
			else {
				
				findUser(tmp.pseudo, function ( userExists ) {
					
					con.sendText(JSON.stringify({
							type: 'login',
							result: userExists ? false : true,
					}));
					if ( userExists ) {
						con.close();
						return;
					}
					
					addUser(pseudo, tmp.password);
					// envoie du message de bienvenue
					con.sendText(JSON.stringify({type: 'msg', date: dateFormat(new Date()), user: "Server", msg: "Bienvenue !"}));

					
					console.log('Utilisateur declaré : ' + pseudo + ' !');
					
					sendMessage("Connexion de l'utilisateur : " + pseudo);
					// ajouter le client courant à la liste des clients
				
					clients.push({
						socket: con,
						pseudo: pseudo
					});
				
					sendUsers();
					
				});
				
			}
		
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
				dbCon.release();
				box.end();
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

function logUser ( userData, cb ) {
	
	var sql = DB.format(
		"SELECT * FROM users WHERE login = ? AND password = ?;",
		[userData.pseudo, userData.password]
	);
	console.log(sql);
	
	dbCon.query(sql, function ( err, rows, fields ) {
		if ( err )
			throw err;
		
		cb(rows.length ? true : false);
		
	});
	
}

function findUser ( login, cb ) {
	
	var sql = DB.format(
		"SELECT * FROM users WHERE login = ?;",
		[login]
	);
	
	dbCon.query(sql, function ( err, rows, fields ) {
		if ( err )
			throw err;
		
		cb(rows.length ? true : false);
		
	});
	
}

function addUser ( login, password ) {
	var sql = DB.format(
		"INSERT INTO users ( login, password ) VALUES ( ?, ? )",
		[login, password]
	);
	dbCon.query(sql, function () {});
}

box.connect(function ( con ) {
	dbCon = con;
	console.log("Connection etablie");
	server.listen(8000);
	console.log('Demarrage du serveur !');
});
