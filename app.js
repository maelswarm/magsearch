#!/usr/bin/env node

process.stdin.setEncoding('utf8');
var plat = process.platform

var argv = require('minimist')(process.argv.slice(2), {})
var mgSrch = require('./')
var clivas = require('clivas')
var pfSpawn = require('child_process').spawn;
var keypress = require('keypress')
keypress(process.stdin);

var nconf = require('nconf');
nconf.use('file', { file: './settings.json' });
nconf.load();

if(nconf.get('port') === undefined) {
	nconf.set('port', "9050");
}
if(nconf.get('host') === undefined) {
	nconf.set('host', "127.0.0.1");
}
if(nconf.get('player') === undefined) {
	nconf.set('player', "--vlc");
}
if(nconf.get('blocklist') === undefined) {
	nconf.set('blocklist', undefined);
}

var settingsrow = 1001
var watchrow = 1500
var cursorcol = 6000
var searchrow = 1500
var searchArr = []
searchArr.push("PIRATEBAY"); searchArr.push("BTDIGG")
var settingsObj = {player:["--vlc", "--airplay", "--mplayer", "--smplayer", "--mpchc", "--potplayer", "--mpv", "--omx", "--webplay", "--jack"], blocklist: undefined}

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
		page: 0,
		keyword: argv.k,
		socks: {port: 9150, host: "127.0.0.1", enabled: 0}
}

if(argv.t || argv._[1]) {
	if(argv.t) {
		options.socks.enabled = 1
	}
}

function launchPF(){
	if(plat === "win32"){
	}
	else{
		var md = 15
		var blist = nconf.get('blocklist')
		var list = [];
		if(searchArr[searchrow%2]==="BTDIGG") {
			md = 10
		}
		list.push(mgSrch.getattr().mag[watchrow%md]+ " ")
		if(blist !== "") {
			list.push("--blocklist="+blist)
		}
		list.push("--all")
		list.push(nconf.get('player'))
		clivas.line(list)
		pfSpawn("peerflix", list, {stdio:'inherit'})
	}
}

function search() {
	if(options.query && (argv.s || argv.L)) {
		if(argv.s === "btd") {
			mgSrch.btdigg(options, function(result) {
				draw()
			})
		}
		else if(argv.s === "tpb") {
			mgSrch.pbay(options, function(result) {
				draw()
			})
		}
	}
} search()


function draw() {
	var result = mgSrch.getattr()
	clivas.clear();
	clivas.line("");
	if(cursorcol%7 === 0) {
		clivas.write(" |"+"{bold+red: "+searchArr[searchrow%2]+" }")
		clivas.write("| watch ")
		clivas.write("| socks |")
		clivas.line(" settings |")
	}
	else if(cursorcol%7 === 1) {
		clivas.write(" | search |")
		clivas.write("{bold+yellow: WATCH }")
		clivas.write("| socks |")
		clivas.line(" settings |")
	}
	else if(cursorcol%7 === 2) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.write("{bold+magenta: SOCKS }"+"|"+"{bold: Port: "+options.socks.port+"} |"+" Host: "+options.socks.host+" |"+
				" Enabled: "+Boolean(options.socks.enabled)+" |")
		clivas.line(" settings |")
	}
	else if(cursorcol%7 === 3) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.write("{bold+magenta: SOCKS }"+"|"+" Port: "+options.socks.port+" |"+"{bold: Host: "+options.socks.host+"} |"+
				" Enabled: "+Boolean(options.socks.enabled)+" |")
		clivas.line(" settings |")
	}
	else if(cursorcol%7 === 4) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.write("{bold+magenta: SOCKS }"+"|"+" Port: "+options.socks.port+" |"+" Host: "+options.socks.host+" |"+"" +
				"{bold: Enabled: "+Boolean(options.socks.enabled)+"} |")
		clivas.line(" settings |")
	}
	else if(cursorcol%7 === 5) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.write(" socks |")
		clivas.line("{bold+blue: SETTINGS }"+"|"+"{bold: "+nconf.get('player')+" }"+"| blocklist |")
	}
	else if(cursorcol%7 === 6) {
		clivas.write(" | search |");
		clivas.write(" watch |");
		clivas.write(" socks |")
		clivas.line("{bold+blue: SETTINGS }"+"|"+" player |"+"{bold: "+nconf.get('blocklist')+" }"+"|")
	}
	clivas.line("");
	for(var i=result.title.length-1; i>=0; i--) {
		if(argv.s === "tpb") {
			if((watchrow%15) == i && cursorcol%7 === 1) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan:"+(i+1)+": "+result.title[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}")
			}
			else {
				clivas.line("{bold: "+(i+1)+": "+result.title[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}")
			}
		}
		else {
			if((watchrow%10) == i && cursorcol%7 === 1) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan:"+(i+1)+": "+result.title[i]+"}")
			}
			else {
				clivas.line("{bold: "+(i+1)+": "+result.title[i]+"}")
			}
		}
	}
	clivas.line("");
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write("Input:"+ searchStr);
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
		process.stdout.write("Input:"+searchStr)
	}
	
	else if (key.ctrl && (key.name == 'n')) {
		options.page++
		options.page = Math.abs(options.page)
		mgSrch.clearattr()
		search()
	}
	
	else if (key && key.ctrl && key.name == 'b') {
		options.page--
		options.page = Math.abs(options.page)
		mgSrch.clearattr()
		search()
	}

	else if (key && key.ctrl && key.name == 'c') {
		nconf.save(function (err) {
			if (err) {
				console.error(err.message)
				process.exit()
			}
			process.exit()
		})
	}

	else if(key.name == "backspace") {
		searchStr = searchStr.slice(0, searchStr.length-1)
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write("Input:"+searchStr)
	}

	else if(key.name == "up") {
		if (cursorcol%7 === 0) {
			searchrow++; 
		}
		else if (cursorcol%7 === 1) {
			watchrow++; 
		}
		else if (cursorcol%7 === 5) {
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			settingsrow++
			nconf.set('player', settingsObj.player[(settingsrow%10)]);
		}
		draw();
	}

	else if(key.name == "down") {
		if (cursorcol%7 === 0) {
			searchrow--
		}
		else if (cursorcol%7 === 1) {
			watchrow--
		}
		else if (cursorcol%7 === 5) {
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			settingsrow--
			nconf.set('player', settingsObj.player[(settingsrow%10)]);
		}
		draw()
	}
	
	else if(key.name == "right") {cursorcol++; draw();}
	
	else if(key.name == "left") {cursorcol--; draw();}
	
	else if(key.name == "return") {
		if (cursorcol%7 === 0) {
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
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			search()
		}
		else if (cursorcol%7 === 1) {
			launchPF()
		}
		else if (cursorcol%7 === 2) {
			options.socks.port = searchStr
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%7 === 3) {
			options.socks.host = searchStr
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%7 === 4) {
			if(options.socks.enabled === 0) {
				options.socks.enabled = 1
			}
			else {
				options.socks.enabled = 0
			}
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%7 === 5) {
			nconf.set('player', settingsObj.player[(settingsrow++)%10]);
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%7 === 6) {
			nconf.set('blocklist', searchStr);
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
	}
	else {
		if(cursorcol%7 === 0 || cursorcol%7 === 2 || cursorcol%7 === 3 || cursorcol%7 === 4 || cursorcol%7 === 6) {
			searchStr += chunk
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write("Input:"+ searchStr);
		}
	}
})

