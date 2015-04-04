#!/usr/bin/env node

process.stdin.setEncoding('utf8');
var plat = process.platform

var mgSrch = require('./index.js')
var settings = require('./settings.js')
var argv = require('minimist')(process.argv.slice(2), {})
var clivas = require('clivas')
var pfSpawn = require('child_process').spawn;
var keypress = require('keypress')
keypress(process.stdin);
var health = require('torrent-health');

var searchStr = ""
var lastSearched = ""
var settingsrow = 1001
var watchrow = 1500
var cursorcol = 6000
var searchrow = 1500
var searchArr = []
searchArr.push("PIRATEBAY"); searchArr.push("BTDIGG")
var keywordArr = []
var keywordrow = 5000
keywordArr.push("all"); keywordArr.push("video"); keywordArr.push("audio"); keywordArr.push("applications"); keywordArr.push("adult");
var playerArr = ["--vlc", "--airplay", "--mplayer", "--smplayer", "--mpchc", "--potplayer", "--mpv", "--omx", "--webplay", "--jack"]


if(argv.h || argv.H) {
	clivas.line("{green:\n  Usage:\r}")
	clivas.line("{green:  Use the arrow keys to toggle and navigate.\r}")
	clivas.line("{green:  To search for a magnet, input text and hit enter.\r}")
	clivas.line("{green:  For SOCKS, set your port and host.\r}")
	clivas.line("{green:  If you want to launch with SOCKS, use a \"-t\" flag\r}")
	clivas.line("{green:  Settings include blocklist and autoplay application. Make sure your blocklist is in the current path!\r}")
	clivas.line("\n")
	process.exit(0)
}

if(!argv.k) {
	argv.k="all"
}

if(!argv.s) {
	argv.s="tpb"
}
if(!argv._[0]) {
	argv._[0]=""
}

var options = {
		query: argv._[0],
		page: 0,
		keyword: argv.k,
		socks: {port: settings.port, host: settings.host, enabled: false}
}

if(argv.t) {
	options.socks.enabled = true
}

function launchPF(){
	var md = 15
	var blist = settings.blocklist
	var list = [];
	if(searchArr[searchrow%2]==="BTDIGG") {
		md = 10
	}
	list.push(mgSrch.getattr().mag[watchrow%md])
	if(blist !== undefined) {
		list.push("--blocklist="+blist)
	}
	if(settings.remove != false) {
		list.push("--remove")
	}
	list.push("--all")
	list.push(settings.player)
	
	if(plat === "win32") {
		list.unshift("/c", "peerflix");
		pfSpawn("cmd", list, {stdio:'inherit'})
	}
	else {
		pfSpawn("peerflix", list, {stdio:'inherit'})
	}
	clivas.line(list)
}

function search() {
	if(options.query && argv.s) {
		if(argv.s === "btd") {
			mgSrch.btdigg(options, function(result) {
				draw()
				if(result.errno) {
					clivas.line("")
					clivas.line("")
					clivas.line(result)
				}
			})
		}
		else if(argv.s === "tpb") {
			mgSrch.pbay(options, function(result) {
				var cnt = 0;
				draw()
				if(result.errno) {
					clivas.line("")
					clivas.line("")
					clivas.line(result)
				}
				if(settings.health === true) {
					for(var i=0; i<result.title.length; i++) {
						mgSrch.gethealth(i, function(fin) {
							cnt+=fin
							if(cnt === result.title.length) {
								draw()
							}
						})
					}
				}
			})
		}
	}
	else {
		draw();
	}
} search()


function draw() {
	var result = mgSrch.getattr()
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	clivas.clear()
	clivas.line("{bold:┎─────────────────────────────────────────────────────────────────────────────────────────────────}")
	if(cursorcol%10 === 0) {
		clivas.write("{bold:┃}"+"{bold+red: "+searchArr[searchrow%2]+" }")
		clivas.write("{bold:│}"+" keyword ")
		clivas.write("│ watch ")
		clivas.write("│ socks │")
		clivas.line(" settings │")
	}
	if(cursorcol%10 === 1) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2])
		clivas.write("{bold: │ "+keywordArr[keywordrow%5]+" │}")
		clivas.write(" watch ")
		clivas.write("│ socks │")
		clivas.line(" settings │")
	}
	else if(cursorcol%10 === 2) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │")
		clivas.write(" keyword "+"{bold:│}")
		clivas.write("{bold+yellow: WATCH }")
		clivas.write("{bold:│}"+" socks │")
		clivas.line(" settings │")
	}
	else if(cursorcol%10 === 3) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch "+"{bold:│}")
		clivas.write("{bold+magenta: SOCKS }"+"{bold:│ Port: "+options.socks.port+" │}"+" Host: "+options.socks.host+" │"+
				" Enabled: "+Boolean(options.socks.enabled)+" │")
		clivas.line(" settings "+"{bold:┃}")
	}
	else if(cursorcol%10 === 4) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch "+"{bold:│}")
		clivas.write("{bold+magenta: SOCKS }"+"{bold:│}"+" Port: "+options.socks.port+" "+"{bold:│ Host: "+options.socks.host+" │}"+
				" Enabled: "+Boolean(options.socks.enabled)+" │")
		clivas.line(" settings "+"{bold:┃}")
	}
	else if(cursorcol%10 === 5) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch "+"{bold:│}")
		clivas.write("{bold+magenta: SOCKS }"+"{bold:│}"+" Port: "+options.socks.port+" │"+" Host: "+options.socks.host+
				"{bold: │ Enabled: "+Boolean(options.socks.enabled)+" │}")
		clivas.line(" settings "+"{bold:┃}")
	}
	else if(cursorcol%10 === 6) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│ "+settings.player+" │}"+" blocklist │"+" mag-print │"+" health │")
	}
	else if(cursorcol%10 === 7) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"{bold:│ "+settings.blocklist+" │}"+" mag-print │"+" health │")
	}
	else if(cursorcol%10 === 8) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"│ blocklist "+"{bold:│ "+settings.printmag+" │}"+" health │")
	}
	else if(cursorcol%10 === 9) {
		clivas.write("{bold:┃ }"+searchArr[searchrow%2]+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"│ blocklist "+"│ mag-print "+"{bold:│ "+settings.health+" │}")
	}
	clivas.line("{bold:┠─────────────────────────────────────────────────────────────────────────────────────────────────}")
	for(var i=result.title.length-1; i>=0; i--) {
		if(argv.s === "tpb") {
			if((watchrow%15) == i && cursorcol%10 === 2) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan: "+result.title[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}"+"{magenta:"+result.peers[i]+"}")
			}
			else {
				clivas.line("{bold:┃ "+result.title[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}"+"{magenta:"+result.peers[i]+"}")
			}
		}
		else {
			if((watchrow%10) == i && cursorcol%10 === 2) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan: "+result.title[i]+"}")
			}
			else {
				clivas.line("{bold:┃ "+result.title[i]+"}")
			}
		}
	}
	clivas.line("{bold:┖─────────────────────────────────────────────────────────────────────────────────────────────────}")
	
	if(cursorcol%10 !== 2) {
		process.stdout.write(" Input:"+ searchStr)
		return
	}
	if(settings.printmag === true) {
		var md = 15
		if(searchArr[searchrow%2]==="BTDIGG") {
			md = 10
		}
		var tempmag = mgSrch.getattr().mag[watchrow%md]
		if(tempmag !== undefined) {
			clivas.write(tempmag)
		}
	}
}
	
var stdin = process.openStdin()
process.stdin.setRawMode(true)
stdin.on('keypress', function (chunk, key) {
	if (key == undefined) {
		searchStr += chunk
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(" Input:"+searchStr)
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
		process.exit()
	}

	else if(key.name == "backspace") {
		searchStr = searchStr.slice(0, searchStr.length-1)
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(" Input:"+searchStr)
	}

	else if(key.name == "up") {
		if (cursorcol%10 === 0) {
			searchrow++; 
		}
		else if (cursorcol%10 === 1) {
			keywordrow++; 
		}
		else if (cursorcol%10 === 2) {
			watchrow++; 
		}
		else if (cursorcol%10 === 6) {
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			settingsrow++
			settings.player = playerArr[(settingsrow%10)]
		}
		draw();
	}

	else if(key.name == "down") {
		if (cursorcol%10 === 0) {
			searchrow--
		}
		else if (cursorcol%10 === 1) {
			keywordrow--; 
		}
		else if (cursorcol%10 === 2) {
			watchrow--
		}
		else if (cursorcol%10 === 6) {
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			settingsrow--
			settings.player = playerArr[(settingsrow%10)]
		}
		draw()
	}
	
	else if(key.name == "right") {cursorcol++; draw();}
	
	else if(key.name == "left") {cursorcol--; draw();}
	
	else if(key.name == "return") {
		if (cursorcol%10 === 0 || cursorcol%10 === 1) {
			options.query = searchStr.trim()
			options.keyword = keywordArr[keywordrow%5]
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
		else if (cursorcol%10 === 2) {
			launchPF()
		}
		else if (cursorcol%10 === 3) {
			options.socks.port = searchStr
			settings.post = options.socks.port
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%10 === 4) {
			options.socks.host = searchStr
			settings.host = options.socks.host
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%10 === 5) {
			if(options.socks.enabled === false) {
				options.socks.enabled = true
			}
			else {
				options.socks.enabled = false
			}
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%10 === 6) {
			settings.player = playerArr[(settingsrow++)%10]
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%10 === 7) {
			if(searchStr.trim() === "") {
				settings.blocklist = undefined
			} else {
				settings.blocklist = searchStr
			}
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%10 === 8) {
			if(settings.printmag === false) {
				settings.printmag = true
			}
			else {
				settings.printmag = false
			}
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
		else if (cursorcol%10 === 9) {
			if(settings.health === false) {
				settings.health = true
			}
			else {
				settings.health = false
			}
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			searchStr = ""
			draw()
		}
	}
	else {
		if(cursorcol%10 === 0 || cursorcol%10 === 1 || cursorcol%10 === 3 || cursorcol%10 === 4 || cursorcol%10 === 5 || cursorcol%10 === 7) {
			searchStr += chunk
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(" Input:"+ searchStr);
		}
	}
})

