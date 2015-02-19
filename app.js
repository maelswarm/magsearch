#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2), {});
var mgSrch = require('./');
var clivas = require('clivas');
var keypress = require('keypress');
keypress(process.stdin);
process.stdin.setEncoding('utf8');

if(!argv.p) {
	argv.p=0;
}

if(argv._[0] && (argv.s || argv.F)) {
	if(argv.F) {
		mgSrch.feelingLucky(argv._[0], function(resultArr) {
			clivas.line("\n");
			clivas.line("----------------------------------------------");
			clivas.line("{bold:"+resultArr[0]+"}");
			clivas.line("{cyan:"+resultArr[1]+"}");
			clivas.line("----------------------------------------------");
			clivas.line("\n");
		});
	}

	else if(argv.s === "btd") {
		mgSrch.btdigg(argv._[0], argv.p, function(resultArr) {
			for(var i=0; i<resultArr[0].length; i++) {
				console.log("----------------------------------------------");
				clivas.line("{bold:"+resultArr[0][i]+"}");
				clivas.line("{white:"+resultArr[2][i]+"}");
				clivas.line("{cyan:"+resultArr[1][i]+"}");
				clivas.line("----------------------------------------------");
				console.log("\n");
			}
		});
	}

	else if(argv.s === "tpb") {
		mgSrch.pbay(argv._[0], argv.p, function(resultArr) {
			for(var i=resultArr[0].length; i>=0; i--) {
				console.log("----------------------------------------------");
				clivas.line("{bold:"+resultArr[0][i]+"}");
				clivas.line("{cyan:"+resultArr[1][i]+"}");
				clivas.line("{green:"+resultArr[2][i]+"}");
				clivas.line("{red:"+resultArr[3][i]+"}");
				console.log("----------------------------------------------");
				console.log("\n");
			}
		});
	}
}