#!/usr/bin/env node

process.stdin.setEncoding('utf8');
var plat = process.platform

var argv = require('minimist')(process.argv.slice(2), {})
var mgSrch = require('./')
var clivas = require('clivas')
var pfSpawn = require('child_process').spawn;
var keypress = require('keypress')
keypress(process.stdin);

var searchrow = 1500
var searchArr = []
searchArr.push("PIRATEBAY"); searchArr.push("BTDIGG")
var watchrow = 1500
var cursorcol = 500

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
	process.exit(0)
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
		socks: {port: 9050, host: "127.0.0.1", enabled: 0}
}

if(argv.t || argv._[1]) {
	if(argv.t) {
		options.socks.enabled = 1
	}
}

function search() {
	if(options.query && (argv.s || argv.L)) {
		if(argv.L) {
			mgSrch.feelingLucky(options, function(result) {
				clivas.line("\n");
				clivas.line("{bold:"+result.title[0]+"}")
				clivas.line("{cyan:"+result.mag[0]+"}")
				clivas.line("\n")
			})
		}

		else if(argv.s === "btd") {
			mgSrch.btdigg(options, function(result) {
				draw()
			})
		}
		else if(argv.s === "tpb") {
			mgSrch.pbay(options, function(result) {
				draw()
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
			})
		}
	}
} search()


function draw() {
	var result = mgSrch.getattr()
	clivas.clear();
	clivas.line("");
	if(cursorcol%5 === 0) {
		clivas.write(" |"+"{bold: "+searchArr[searchrow%2]+" }");
		clivas.write("| watch ");
		clivas.line("| socks |");
	}
	else if(cursorcol%5 === 1) {
		clivas.write(" | search |");
		clivas.write("{bold: WATCH }");
		clivas.line("| socks |");
	}
	else if(cursorcol%5 === 2) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.line("{bold: SOCKS }"+"|"+"{bold: Port: "+options.socks.port+"} |"+" Host: "+options.socks.host+" |"+" Enabled: "+Boolean(options.socks.enabled)+" |")
	}
	else if(cursorcol%5 === 3) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.line("{bold: SOCKS }"+"|"+" Port: "+options.socks.port+" |"+"{bold: Host: "+options.socks.host+"} |"+" Enabled: "+Boolean(options.socks.enabled)+" |")
	}
	else if(cursorcol%5 === 4) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.line("{bold: SOCKS }"+"|"+" Port: "+options.socks.port+" |"+" Host: "+options.socks.host+" |"+"{bold: Enabled: "+Boolean(options.socks.enabled)+"} |")
	}
	clivas.line("");
	for(var i=result.title.length-1; i>=0; i--) {
		if(argv.s === "tpb") {
			if((watchrow%15) == i && cursorcol%5 === 1) {
				clivas.line("{bold+cyan:>"+(i+1)+": "+result.title[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}")
			}
			else {
				clivas.line("{bold: "+(i+1)+": "+result.title[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}")
			}
		}
		else {
			if((watchrow%10) == i && cursorcol%5 === 1) {
				clivas.line("{bold+cyan:>"+(i+1)+": "+result.title[i]+"}")
			}
			else {
				clivas.line("{bold: "+(i+1)+": "+result.title[i]+"}")
			}
		}
	}
	clivas.line("");
}

var searchStr = ""
var lastSearched = ""
	
var stdin = process.openStdin()
process.stdin.setRawMode(true)
stdin.on('keypress', function (chunk, key) {
	if (key == undefined) {
		searchStr += chunk
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(searchStr)
	}

	else if (key && key.ctrl && key.name == 'c') process.exit()

	else if(key.name == "backspace") {
		searchStr = searchStr.slice(0, searchStr.length-1)
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(searchStr)
	}

	else if(key.name == "up") {
		if (cursorcol%5 === 0) {
			searchrow++; 
		}
		else if (cursorcol%5 === 1) {
			watchrow++; 
		}
		draw();
	}

	else if(key.name == "down") {
		if (cursorcol%5 === 0) {
			searchrow--
		}
		else if (cursorcol%5 === 1) {
			watchrow--
		}
		draw()
	}
	
	else if(key.name == "right") {cursorcol++; draw();}
	
	else if(key.name == "left") {cursorcol--; draw();}
	
	else if(key.name == "return") {
		if (cursorcol%5 === 0) {
			options.query = searchStr.trim()
			mgSrch.clearattr()
			lastSearched = searchStr
			if(searchArr[searchrow%2]==="PIRATEBAY") {
				argv.s = "tpb"
			}
			else {
				argv.s = "btd"
			}
			watchrow = 1500
			search()
		}
		else if (cursorcol%5 === 1) {
			//launch peerflix
		}
		else if (cursorcol%5 === 2) {
			options.socks.port = searchStr
		}
		else if (cursorcol%5 === 3) {
			options.socks.host = searchStr
		}
		else if (cursorcol%5 === 4) {
			if(options.socks.enabled === 0) {
				options.socks.enabled = 1
			}
			else {
				options.socks.enabled = 0
			}
		}
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		draw();
		searchStr = ""
	}
	else {
		if(cursorcol%5 === 0 || cursorcol%5 === 2) {
			searchStr += chunk
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(searchStr);
		}
	}
})

