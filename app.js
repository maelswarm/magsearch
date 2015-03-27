#!/usr/bin/env node

process.stdin.setEncoding('utf8');
var plat = process.platform

var argv = require('minimist')(process.argv.slice(2), {})
var mgSrch = require('./')
var clivas = require('clivas')
var pfSpawn = require('child_process').spawn;
var keypress = require('keypress')
keypress(process.stdin);

function launchPF(){
	if(plat === "win32"){
	}
	else{
		//pfSpawn("peerflix", argsList, {stdio:'inherit'});
	}
}

var width = 0
var drawPBShip = function() {
	if(width < 20) {
		clivas.clear()
		clivas.write("{blue:"+Array(width+1).join(" ")+"}")
		clivas.line("{bold:       __"+Array(20-width).join(" ")+"}")
		clivas.write("{blue:"+Array(width+1).join(" ")+"}")
		clivas.line("{bold:    __ )_)__"+Array(20-width).join(" ")+"}")
		clivas.write("{blue:"+Array(width+1).join(" ")+"}")
		clivas.line("{bold:    )_))_))_)"+Array(20-width).join(" ")+"}")
		clivas.write("{blue:"+Array(width+1).join(" ")+"}")
		clivas.line("{bold:    _|__|__|__"+Array(20-width).join(" ")+"}")
		clivas.write("{cyan:"+Array(width+1).join("~")+"}")
		clivas.line("{cyan:~~~~}"+"{bold:\\_______/}"+"{cyan:~~~~"+Array(20-width).join("~")+"}")
		clivas.write("{cyan:"+Array(width+1).join("~")+"}")
		clivas.line("{cyan:~~~~~~~~~~~~~~~~~"+Array(20-width).join("~")+"}")
		clivas.write("{cyan:"+Array(width+1).join("~")+"}")
		clivas.line("{cyan:~~~~~~~~~~~~~~~~~"+Array(20-width).join("~")+"}")
		width++
	}
}

if(argv.h || argv.H) {
	clivas.line("{green:\n  Usage:\r}")
	clivas.line("{green:  -s <option> : tpb (PirateBay), opb (OldPB), btd (Btdigg), and thd (TorrentHound).\r}")
	clivas.line("{green:  -p <option> : Choose page (default is 1).\r}")
	clivas.line("{green:  -k <option> : Keyword options are video, audio, adult, or applications. Only available on tpb and opb.\r}")
	clivas.line("{green:  -t <port> <hostname> : Socks default port is 9050, and default host is 127.0.0.1. Only available on tpb and btd.\r}")
	clivas.line("{green:  -L <option> : In case your feeling lucky.\r}")
	clivas.line("\n")
}

if(!argv.p) {
	argv.p=1
}

if(!argv.k) {
	argv.k="all"
}

if(!argv.s) {
	argv.s="tpb"
}

var options = {
		query: argv._[0],
		page: argv.p-1,
		keyword: argv.k,
		socks: {port: undefined, host: undefined}
}

if(argv.t || argv._[1]) {
	options.socks.port = argv.t
	options.socks.host = argv._[1]
}

if(argv._[0] && (argv.s || argv.L)) {
	if(argv.L) {
		mgSrch.feelingLucky(options, function(result) {
			clivas.line("\n");
			clivas.line("{bold:"+result.title[0]+"}")
			clivas.line("{cyan:"+result.mag[0]+"}")
			clivas.line("\n")
			process.exit(0)
		})
	}

	else if(argv.s === "btd") {
		clivas.line("{bold:"+"\nSearching with BTDigg."+"}")
		mgSrch.btdigg(options, function(result) {
			clivas.line("\n")
			for(var i=result.title.length-1; i>=0; i--) {
				clivas.line("{bold:"+result.title[i]+"}")
				clivas.line("{cyan:"+result.mag[i]+"}")
				clivas.line("\n")
			}
			process.exit(0)
		})
	}

	else if(argv.s === "tpb") {
		var drawInterval = setInterval(drawPBShip, 800)
		mgSrch.pbay(options, function(result) {
			clearInterval(drawInterval)
			clivas.line("\n")
			for(var i=result.title.length-1; i>=0; i--) {
				clivas.line("{bold:"+result.title[i]+"}")
				clivas.line("{cyan:"+result.mag[i]+"}")
				clivas.line("{green:"+result.seeders[i]+"  }"+"{red:"+result.leechers[i]+"}")
				clivas.line("\n");
			}
			process.exit(0)
		})
	}
	else if(argv.s === "opb") {
		clivas.line("{bold:"+"\nSearching with OldPirateBay."+"}")
		mgSrch.oldpbay(options, function(result) {
			clivas.line("\n")
			for(var i=result.title.length-1; i>=0; i--) {
				clivas.line("{bold:"+result.title[i]+"}")
				clivas.line("{cyan:"+result.mag[i]+"}")
				clivas.line("{green:"+result.seeders[i]+"  }"+"{red:"+result.leechers[i]+"}")
				clivas.line("\n")
			}
			process.exit(0)
		})
	}
	else if(argv.s === "thd") {
		clivas.line("{bold:"+"\nSearching with TorrentHound. Notice: some trackers in their given magnet links are dead."+"}");
		mgSrch.torhound(options, function(result) {
			clivas.line("\n")
			for(var i=result.title.length-1; i>=0; i--) {
				clivas.line("{bold:"+result.title[i]+"}")
				clivas.line("{cyan:"+result.mag[i]+"}")
				clivas.line("{green:"+result.seeders[i]+"  }"+"{red:"+result.leechers[i]+"}")
				clivas.line("\n")
			}
			process.exit(0)
		})
	}
}

else if(!argv.h && !argv.H) {
	clivas.line("{green:\n  Usage:\r}")
	clivas.line("{green:  -s <option> : tpb (PirateBay), opb (OldPB), btd (Btdigg), and thd (TorrentHound).\r}")
	clivas.line("{green:  -p <option> : Choose page (default is 1).\r}")
	clivas.line("{green:  -k <option> : Keyword options are video, audio, adult, or applications. Only available on tpb and opb.\r}")
	clivas.line("{green:  -t <port> <hostname> : Socks default port is 9050, and default host is 127.0.0.1. Only available on tpb and btd.\r}")
	clivas.line("{green:  -L <option> : In case your feeling lucky.\r}")
	clivas.line("\n")
}



//var searchStr = ""
//var flag = ""
//var txt = ""
//
//var stdin = process.openStdin()
//process.stdin.setRawMode(true)
//stdin.on('keypress', function (chunk, key) {
//	if (key == undefined) {searchStr += chunk; process.stdout.clearLine(); process.stdout.cursorTo(0); process.stdout.write(searchStr);}
//
//	else if (key && key.ctrl && key.name == 'c') process.exit()
//
//	else if(key.name == "backspace") {searchStr = searchStr.slice(0, searchStr.length-1)}
//
//	else if(key.name == "return") {
//		console.log("\n")
//		if (searchStr[0] === 'r') {}
//		
//		else if (searchStr[0] === 's') {}
//	}
//	else { searchStr += chunk;}
//	process.stdout.clearLine();
//	process.stdout.cursorTo(0);
//	process.stdout.write(searchStr);
//});





