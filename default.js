var tap = require('tap');

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
			app.pbay("blade runner", 0, "video", undefined, [], function(resultArr) {
				t.type((resultArr[0][3]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test BTDIGG', function(t) {
			app = require('./index.js');
			app.btdigg("blade runner", 0, undefined, [], function(resultArr) {
				t.type((resultArr[0][3]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test OLDPB', function(t) {
			tArr = app.oldpbay("blade runner", 1, "video", function(resultArr) {
				t.type((resultArr[0][3]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test FEELINGLUCKY', function(t) {
			app.feelingLucky("blade runner", undefined, [], function(resultArr) {
				t.type((resultArr[0][0]), 'string', 'PASS');
				t.end();
			});
		});
		tap.test('Test TORHOUND', function(t) {
			app.torhound("blade runner", 1, function(resultArr) {
				t.type((resultArr[0][3]), 'string', 'PASS');
				t.end();
			});
		});
	}
});