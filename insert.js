var db = require('node-mysql');
var DB = db.DB;

	
var box = new DB({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'chat'
});

var dbCon;

function addUser ( login, password ) {
	var sql = DB.format(
		"INSERT INTO users ( login, password ) VALUES ( ?, ? )",
		[login, password]
	);
	dbCon.query(sql, function () {});
}

box.connect(function ( con ) {
	
	dbCon = con;
	addUser('test5', 'test5');
	con.release();
	box.end();
	
});
