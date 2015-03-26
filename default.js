var tap = require('tap');

var options = {
		query: "blade runner",
		page: 1,
		keyword: "video",
		socks: {port: undefined, host: undefined}
}

tap.test('App loads', function(t) {
	t.doesNotThrow(load_app, 'No problem loading the app.js file')
	t.end()

	function f() {
		process.exit(0)
	}
	setTimeout(f, 15000)

	function load_app() {
		var app = require('./index.js');
		tap.test('Test TPB', function(t) {
			app.pbay(options, function(result) {
				t.type((result.title[3]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test BTDIGG', function(t) {
			app = require('./index.js');
			app.btdigg(options, function(result) {
				t.type((result.title[3]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test OLDPB', function(t) {
			tArr = app.oldpbay(options, function(result) {
				t.type((result.title[3]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test FEELINGLUCKY', function(t) {
			app.feelingLucky(options, function(result) {
				t.type((result.title[0]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test TORHOUND', function(t) {
			app.torhound(options, function(result) {
				t.type((result.title[3]), 'string', 'PASS');
				t.end();
			});
		});
	}
});