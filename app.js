var mgSrch = require('./index.js');
var argv = require('minimist')(process.argv.slice(2), {});
process.title = 'magsearch';

if(!argv.p) {
	argv.p=0;
}
if(argv._[0] && (argv.s||argv.F)) {
	if(argv.F) {
		mgSrch.feelingLucky(argv._[0], function(resultArr) {
			console.log(resultArr[0]);
			console.log(resultArr[1]);
		});
	}
	else if(argv.s === "btd") {
		mgSrch.btdigg(argv._[0], argv.p);
	}
	else if(argv.s === "tpb") {
		mgSrch.pbay(argv._[0], argv.p);
	}
}
