var tap = require('tap');

tap.test('App loads', function(t) {
	t.doesNotThrow(load_app, 'No problem loading the app.js file')
	t.end()

	function load_app() {
		var app = require('./index.js')
	}
});

tap.test('Test TPB', function(t) {
	var app = require('./index.js')
	app.pbay("blade runner", 0, "video", function(resultArr) {
		t.type((resultArr[0][3]), 'string', 'PASS');
		t.end();
	});
});
tap.test('Test BTDIGG', function(t) {
	var app = require('./index.js')
	app.btdigg("blade runner", 0, function(resultArr) {
		t.type((resultArr[0][3]), 'string', 'PASS');
		t.end();
	});
});
tap.test('Test OLDPB', function(t) {
	var app = require('./index.js')
	tArr = app.oldpbay("blade runner", 1, "video", function(resultArr) {
		t.type((resultArr[0][3]), 'string', 'PASS');
		t.end();
	});
});
tap.test('Test FEELINGLUCKY', function(t) {
	var app = require('./index.js')
	app.feelingLucky("blade runner", function(resultArr) {
		t.type((resultArr[0][0]), 'string', 'PASS');
		t.end();
	});
});
tap.test('Test TORHOUND', function(t) {
	var app = require('./index.js')
	app.torhound("blade runner", 1, function(resultArr) {
		t.type((resultArr[0][3]), 'string', 'PASS');
		t.end();
	});
});