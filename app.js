var mgSrch = require('./');
var argv = require('minimist')(process.argv.slice(2), {});
process.title = 'magsearch';

if(!argv.p) {
	argv.p=0;
}
if(argv._[0] && (argv.s||argv.F)) {
	if(argv.F) {
		mgSrch.feelingLucky(argv._[0], function(resultArr) {
			for(var i=0; i<resultArr.length(); i++) {
				console.log(resultArr[0]);
				console.log(resultArr[1]);
			}
		});
	}
	else if(argv.s === "btd") {
		mgSrch.btdigg(argv._[0], argv.p, function(resultArr) {
			for(var i=0; i<resultArr[0].length; i++) {
				console.log("----------------------------------------------");
				console.log(resultArr[0][i]);
				console.log(resultArr[2][i]);
				console.log(resultArr[1][i]);
				console.log("----------------------------------------------");
				console.log("\n");
			}
		});
	}
	else if(argv.s === "tpb") {
		mgSrch.pbay(argv._[0], argv.p, function(resultArr) {
			for(var i=resultArr[0].length; i>=0; i--) {
				console.log("----------------------------------------------");
				console.log(resultArr[0][i]);
				console.log(resultArr[1][i]);
				console.log(resultArr[2][i]);
				console.log(resultArr[3][i]);
				console.log("----------------------------------------------");
				console.log("\n");
			}
		});
	}
}
