#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2), {});
var mgSrch = require('./');
var clivas = require('clivas');
var socksArr = [];

if(argv.h) {
	clivas.line("{green:\n  Usage:\r}");
	clivas.line("{green:  -s <option> : tpb (ThePirateBay), opb (OldPirateBay), btd (Btdigg), and thd (TorrentHound).\r}");
	clivas.line("{green:  -p <option> : Choose page (default is 1).\r}");
	clivas.line("{green:  -k <option> : Keyword options are video, audio, adult, or applications. Only available on tpb and opb.\r}");
	clivas.line("{green:  -t <port> <hostname> : Socks default port is 9050, and default host is 127.0.0.1. Only available on tpb and btd.\r}");
	clivas.line("{green:  -L <option> : In case your feeling lucky.\r}");
	clivas.line("\n");
}

if(!argv.p) {
	argv.p=1;
}

if(!argv.k) {
	argv.k="all";
}
if(argv.t || argv._[1]) {
	socksArr[0] = argv.t;
	socksArr[1] = argv._[1];
}

if(argv._[0] && (argv.s || argv.L)) {
	if(argv.L) {
		mgSrch.feelingLucky(argv._[0], argv.t, socksArr, function(resultArr) {
			clivas.line("\n");
			clivas.line("{bold:"+resultArr[0]+"}");
			clivas.line("{cyan:"+resultArr[1]+"}");
			clivas.line("\n");
			process.exit(0);
		});
	}

	else if(argv.s === "btd") {
		clivas.line("{bold:"+"\nSearching with BTDigg."+"}");
		mgSrch.btdigg(argv._[0], argv.p-1, argv.t, socksArr, function(resultArr) {
			clivas.line("\n");
			for(var i=resultArr[0].length-1; i>=0; i--) {
				clivas.line("{bold:"+resultArr[0][i]+"}");
				clivas.line("{white:"+resultArr[2][i]+"}");
				clivas.line("{cyan:"+resultArr[1][i]+"}");
				clivas.line("\n");
			}
			process.exit(0);
		});
	}

	else if(argv.s === "tpb") {
		clivas.line("{bold:"+"\nSailing on Pirate Bay."+"}");
		mgSrch.pbay(argv._[0], argv.p-1, argv.k, argv.t, socksArr, function(resultArr) {
			clivas.line("\n");
			for(var i=resultArr[0].length-1; i>=0; i--) {
				clivas.line("{bold:"+resultArr[0][i]+"}");
				clivas.line("{cyan:"+resultArr[1][i]+"}");
				clivas.line("{green:"+resultArr[2][i]+"}");
				clivas.line("{red:"+resultArr[3][i]+"}");
				clivas.line("\n");
			}
			process.exit(0);
		});
	}
	else if(argv.s === "opb") {
		clivas.line("{bold:"+"\nSearching with OldPirateBay."+"}");
		mgSrch.oldpbay(argv._[0], argv.p, argv.k, function(resultArr) {
			clivas.line("\n");
			for(var i=resultArr[0].length-1; i>=1; i--) {
				clivas.line("{bold:"+resultArr[0][i]+"}");
				clivas.line("{cyan:"+resultArr[1][i]+"}");
				clivas.line("{green:"+resultArr[2][i]+"}");
				clivas.line("{red:"+resultArr[3][i]+"}");
				clivas.line("\n");
			}
			process.exit(0);
		});
	}
	else if(argv.s === "thd") {
		clivas.line("{bold:"+"\nSearching with TorrentHound. Notice: some trackers in their given magnet links are dead."+"}");
		mgSrch.torhound(argv._[0], argv.p, function(resultArr) {
			clivas.line("\n");
			for(var i=resultArr[0].length-1; i>=1; i--) {
				clivas.line("{bold:"+resultArr[0][i]+"}");
				clivas.line("{cyan:"+resultArr[1][i]+"}");
				clivas.line("{green:"+resultArr[2][i]+"}");
				clivas.line("{red:"+resultArr[3][i]+"}");
				clivas.line("\n");
			}
			process.exit(0);
		});
	}
}

else if(!argv.h) {
	clivas.line("{green:\n  Usage:\r}");
	clivas.line("{green:  -s <option> : tpb (ThePirateBay), opb (OldPirateBay), btd (Btdigg), and thd (TorrentHound).\r}");
	clivas.line("{green:  -p <option> : Choose page (default is 1).\r}");
	clivas.line("{green:  -k <option> : Keyword options are video, audio, adult, or applications. Only available on tpb and opb.\r}");
	clivas.line("{green:  -t <port> <hostname> : Socks default port is 9050, and default host is 127.0.0.1. Only available on tpb and btd.\r}");
	clivas.line("{green:  -L <option> : In case your feeling lucky.\r}");
	clivas.line("\n");
}
