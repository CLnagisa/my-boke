var mysql = require('mysql');


var connection = mysql.createConnection({
	host: 'localhost',
	user: 'node',
	password: 'node',
	port: '3306',
	database: 'node'
});





connection.connect(function(err) {
	if(err) {
		console.log('[query] - :' + err );
		return;
	}
	console.log('[connection connect] succeed!');
});

connection.query('select * from node', function(err, rows, fields) {
	if(err) {
		console.log('[query] - :' + err);
		return;
	}
	console.log('The result is:', rows[0].b);
});

connection.end(function(err) {
	if(err) {
		return;
	}
	console.log('[connection end] succeed!');
});
