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
			clivas.line("----------------------------------------------");
			clivas.line("{bold:"+resultArr[0]+"}");
			clivas.line("{cyan:"+resultArr[1]+"}");
			clivas.line("----------------------------------------------");
			clivas.line("\n");
		});
	}

	else if(argv.s === "btd") {
		mgSrch.btdigg(argv._[0], argv.p, function(resultArr) {
			for(var i=resultArr[0].length-1; i>=0; i--) {
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
			for(var i=resultArr[0].length-1; i>=0; i--) {
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

//var searchStr = "";
//var flag = "";
//
//var stdin = process.openStdin(); 
//process.stdin.setRawMode(true);
//stdin.on('keypress', function (chunk, key) {
//	if (key && key.ctrl && key.name == 'c') process.exit();
//	else if(key.name == "backspace") {searchStr = searchStr.slice(0, searchStr.length-1);}
//	else if(key.name == "return") {
//		console.log("\n");
//		if ((var i=searchStr.search("-"))!=-1) {
//			flag = searchstr
//		}
//		
//		mgSrch.pbay(searchStr, argv.p, function(resultArr) {
//			for(var i=resultArr[0].length-1; i>=0; i--) {
//				console.log("----------------------------------------------");
//				clivas.line("{bold:"+resultArr[0][i]+"}");
//				clivas.line("{cyan:"+resultArr[1][i]+"}");
//				clivas.line("{green:"+resultArr[2][i]+"}");
//				clivas.line("{red:"+resultArr[3][i]+"}");
//				console.log("----------------------------------------------");
//				console.log("\n");
//			}
//			process.stdout.write(searchStr);
//		});
//	}
//	else { searchStr += chunk;}
//	process.stdout.clearLine();
//	process.stdout.cursorTo(0);
//	process.stdout.write(searchStr);
//});


