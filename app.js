#!/usr/bin/env node

process.stdin.setEncoding('utf8');
var plat = process.platform

var mgSrch = require('./index.js')
var settings = require('./settings.js')
var http = require('http')
var fs = require('fs')
var os = require('os')
var argv = require('minimist')(process.argv.slice(2), {})
var clivas = require('clivas')
var pfSpawn = require('child_process').spawn;
var keypress = require('keypress')
keypress(process.stdin);
var health = require('torrent-health');
var opensubtitles = require('opensubtitles-client');

var searchStr = ""
var lastSearched = ""
var playerrow = 1002
var subrow = 996
var watchrow = 1500
var cursorcol = 6006
var searchrow = 1500
var keywordrow = 5000
var searchArr = ["PIRATEBAY", "KICKASS", "BTDIGG", "DEMONOID"]
var keywordArr = ["all", "video", "audio", "applications", "adult"]
var playerArr = ["none", "--vlc", "--airplay", "--mplayer", "--smplayer", "--mpchc", "--potplayer", "--mpv", "--omx", "--webplay", "--jack"]
var subArr = ["none", "eng", "chi", "ger", "ita", "jpn", "kor", "pol", "por", "rus", "spa", "swe"]

if(argv.h || argv.H || argv.help || argv.HELP) {
	clivas.line("{green:\n  Usage:\r}")
	clivas.line("{green:  Use the arrow keys to toggle and navigate.\r}")
	clivas.line("{green:  To search for a magnet, input text and hit enter.\r}")
	clivas.line("{green:  For SOCKS, set your port and host. If you use TOR, .onion sites will be used (except with kickass).\r}")
	clivas.line("{green:  If you want to launch with TOR enabled, use \"-t\" flag and \"-p\" followed by the port number (probably 9050 or 9150).\r}")
	clivas.line("{green:  If you use a blocklist, then make sure it's in the current path!\r}")
	clivas.line("\n")
	process.exit(0)
}

if(!argv.k) {
	argv.k="all"
}

if(!argv.s) {
	argv.s="tpb"
}

if(!argv.p) {
	argv.p=settings.port;
} else {
	settings.port = argv.p
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

function getSubs(md, callback) {
	var title = mgSrch.getattr().title[watchrow%md]
	opensubtitles.api.login()
	.then(function(token){
		opensubtitles.api.search(token, settings.subtitles, {
		    query: title,
		    tag: ""
		})
		.then(function(results) {
			if (results[0] !== undefined) {
				clivas.line("Found subs. One moment please.")

				var url = results[0].SubDownloadLink.split('.gz').join('.srt')
				console.log(url)
				var path = os.tmpdir() + "sub.srt"

				function retrieve(url, path) {
					var temp = fs.createWriteStream(path)
					http.get(url, function(response) {
						response.pipe(temp)
						temp.on('finish', function() {
							clivas.line("Subtitles downloaded.")
							opensubtitles.api.logout(token)
							return callback(path)
						})
					})
				} retrieve(url, path);

			} else {
				clivas.line("No subs")
				opensubtitles.api.logout(token)
				return callback(null)
			}
		})
	})
}

function launchPF(callback) {
	var tc = 0
	var endSpawn = function() {
		clearInterval(tcInterval)
		if(settings.path !== "tmp") {
			list.push("--path="+settings.path)
		}
		if(settings.player !== "none") {
			list.push(settings.player)
		}
		if(plat === "win32") {
			list.unshift("/c", "peerflix");
			pfSpawn("cmd", list, {stdio:'inherit'})
		}
		else {
			pfSpawn("peerflix", list, {stdio:'inherit'})
		}
		clivas.line(list)
	}

	var tcInterval = setInterval(function() {
		if(tc===2) {
			endSpawn();
		}
	}, 1250);

	clivas.line("Preparing...")

	var md = 15
	if(searchArr[searchrow%4]==="BTDIGG") {
		md = 10
	}
	var blist = settings.blocklist
	var list = [];
	
	list.push(mgSrch.getattr().mag[watchrow%md])
	if(settings.remove != false && settings.path === "tmp") {
		list.push("--remove")
	}
	list.push("--all")
	
	if(blist === "auto") {
		if(plat !== "win32") {
			list.push("--blocklist=/usr/local/lib/node_modules/magsearch/btlev1")
		} else {
			list.push("--blocklist=C:\Users\Administrator\AppData\Roaming\npm\node_modules\magsearch\btlev1")
		}
		tc++
	} else {
		if(blist !== undefined) {
			list.push("--blocklist="+blist)
		}
		tc++
	}
	if(settings.subtitles !== "none") {
		getSubs(md, function(result) {
			if(result !== null) {
				list.push("--subtitles="+result)
			}
			tc++
		})
	} else {
		tc++
	}
}

function search() {
	if(options.query && argv.s) {
		if(argv.s === "btd") {
			mgSrch.btdigg(options, function(result) {
				draw()
				if(result===undefined) {
					return
				}
				if(result.errno) {
					clivas.line("")
					clivas.line("")
					clivas.line(result)
					return
				}
			})
		}
		else if(argv.s === "tpb") {
			mgSrch.pbay(options, function(result) {
				var cnt = 0;
				draw()
				if(result===undefined) {
					return
				}
				if(result.errno) {
					clivas.line("")
					clivas.line("")
					clivas.line(result.errno)
					return
				}
				if(result.title === undefined) {
					clivas.line("")
					clivas.line("")
					clivas.line("Either there are no results, or the piratebay is down. Try using it's .onion.")
					return
				}
				if(settings.health === true) {
					var len = result.title.length
					for(var i=0; i<len; i++) {
						mgSrch.gethealth(i, function(fin) {
							cnt+=fin
							if(cnt === len) {
								draw()
							}
						})
					}
				}
			})
		}
		else if(argv.s === "kat") {
			mgSrch.kat(options, function(result) {
				
				//var cnt = 0;
				draw()
				if(result===undefined) {
					return
				}
				if(result.errno) {
					clivas.line("")
					clivas.line("")
					clivas.line(result.errno)
					return
				}
				if(result.title === undefined) {
					clivas.line("")
					clivas.line("")
					clivas.line("Either there are no results, or the kickass is down. Try a different search engine.")
					return
				}
			})
		}
		else if(argv.s === "demon") {
			mgSrch.demon(options, function(result) {
				
				//process.exit()
				var cnt = 0;
				draw()
				if(result===undefined) {
					return
				}
				if(result.errno) {
					clivas.line("")
					clivas.line("")
					clivas.line(result.errno)
					return
				}
				if(result.title === undefined) {
					clivas.line("")
					clivas.line("")
					clivas.line("Either there are no results, or the demon is down. Try using it's .onion.")
					return
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
	var searchEngine = searchArr[searchrow%4]
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	clivas.clear()
	clivas.line("{bold:┎──────────────────────────────────────────────────────────────────────────────────────────────────────────────────}")
	if(cursorcol%11 === 0) {
		clivas.write("{bold:┃}"+"{bold+red: "+searchEngine+" }")
		clivas.write("{bold:│}"+" keyword ")
		clivas.write("│ watch ")
		clivas.write("│ socks │")
		clivas.line(" settings │")
	}
	if(cursorcol%11 === 1) {
		clivas.write("{bold:┃ }"+searchEngine)
		clivas.write("{bold: │ "+keywordArr[keywordrow%5]+" │}")
		clivas.write(" watch ")
		clivas.write("│ socks │")
		clivas.line(" settings │")
	}
	else if(cursorcol%11 === 2) {
		clivas.write("{bold:┃ }"+searchEngine+" │")
		clivas.write(" keyword "+"{bold:│}")
		clivas.write("{bold+yellow: WATCH }")
		clivas.write("{bold:│}"+" socks │")
		clivas.line(" settings │")
	}
	else if(cursorcol%11 === 3) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch "+"{bold:│}")
		clivas.write("{bold+magenta: SOCKS }"+"{bold:│ Port: "+options.socks.port+" │}"+" Host: "+options.socks.host+" │"+
				" Enabled: "+Boolean(options.socks.enabled)+" │")
		clivas.line(" settings "+"{bold:┃}")
	}
	else if(cursorcol%11 === 4) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch "+"{bold:│}")
		clivas.write("{bold+magenta: SOCKS }"+"{bold:│}"+" Port: "+options.socks.port+" "+"{bold:│ Host: "+options.socks.host+" │}"+
				" Enabled: "+Boolean(options.socks.enabled)+" │")
		clivas.line(" settings "+"{bold:┃}")
	}
	else if(cursorcol%11 === 5) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch "+"{bold:│}")
		clivas.write("{bold+magenta: SOCKS }"+"{bold:│}"+" Port: "+options.socks.port+" │"+" Host: "+options.socks.host+
				"{bold: │ Enabled: "+Boolean(options.socks.enabled)+" │}")
		clivas.line(" settings "+"{bold:┃}")
	}
	else if(cursorcol%11 === 6) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│ "+settings.player+" │}"+" blocklist │"+" mag-print │"+" subtitles │"+" path │")
	}
	else if(cursorcol%11 === 7) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"{bold:│ "+settings.blocklist+" │}"+" mag-print │"+" subtitles │"+" path │")
	}
	else if(cursorcol%11 === 8) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"│ blocklist "+"{bold:│ "+settings.printmag+" │}"+" subtitles │"+" path │")
	}
	else if(cursorcol%11 === 9) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"│ blocklist "+"│ mag-print "+"{bold:│ "+settings.subtitles+" │}"+" path │")
	}
	else if(cursorcol%11 === 10) {
		clivas.write("{bold:┃ }"+searchEngine+" │");
		clivas.write(" keyword │")
		clivas.write(" watch │")
		clivas.write(" socks "+"{bold:│}")
		clivas.line("{bold+blue: SETTINGS }"+"{bold:│}"+" player "+"│ blocklist "+"│ mag-print "+"│ subtitles "+"{bold:│ "+settings.path+" │}")
	}
	clivas.line("{bold:┠──────────────────────────────────────────────────────────────────────────────────────────────────────────────────}")
	for(var i=result.title.length-1; i>=0; i--) {
		if(argv.s === "tpb" || argv.s === "kat") {
			if((watchrow%15) == i && cursorcol%11 === 2) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan: "+result.title[i]+"}"+"{bold: "+result.size[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}"+"{magenta:"+result.peers[i]+"}")
			}
			else {
				clivas.line("{bold:┃ "+result.title[i]+"}"+"{bold: "+result.size[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}"+"{magenta:"+result.peers[i]+"}")
			}
		} else if (argv.s === "demon") {
			if((watchrow%15) == i && cursorcol%11 === 2) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan: "+result.title[i]+"}"+"{bold: "+result.size[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}")
			}
			else {
				clivas.line("{bold:┃ "+result.title[i]+"}"+"{bold: "+result.size[i]+"}"+"{green:"+result.seeders[i]+"}"+"{red:"+result.leechers[i]+"}")
			}
		}
		else {
			if((watchrow%11) == i && cursorcol%11 === 2) {
				clivas.line("{bold+cyan+blink:>}"+"{bold+cyan: "+result.title[i]+"}")
			}
			else {
				clivas.line("{bold:┃ "+result.title[i]+"}")
			}
		}
	}
	clivas.line("{bold:┖──────────────────────────────────────────────────────────────────────────────────────────────────────────────────}")
	if(result.url != "") {
		if(argv.s === "kat" && options.socks.enabled) {
			clivas.line(" URL:"+result.url+" Note: kat's onion isn't supported.")
		} else {
			clivas.line(" URL:"+result.url);
		}
	}
	if(cursorcol%11 !== 2) {
		if(cursorcol%11 === 0 || cursorcol%11 === 1) {
			process.stdout.write(" Search:"+ searchStr)
		} else {
			process.stdout.write(" Input:"+ searchStr)
		}
		return
	}
	if(settings.printmag === true) {
		var md = 15
		if(searchArr[searchrow%4]==="BTDIGG") {
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
		if(cursorcol%11 === 0 || cursorcol%11 === 1) {
			process.stdout.write(" Search:"+ searchStr)
		} else {
			process.stdout.write(" Input:"+ searchStr)
		}
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
		if(cursorcol%11 === 0 || cursorcol%11 === 1) {
			process.stdout.write(" Search:"+ searchStr)
		} else {
			process.stdout.write(" Input:"+ searchStr)
		}
	}

	else if(key.name == "up") {
		if (cursorcol%11 === 0) {
			searchrow++; 
		}
		else if (cursorcol%11 === 1) {
			keywordrow++; 
		}
		else if (cursorcol%11 === 2) {
			watchrow++; 
		}
		else if (cursorcol%11 === 6) {
			resetInput()
			playerrow++
			settings.player = playerArr[(playerrow%11)]
		}
		else if (cursorcol%11 === 9) {
			resetInput()
			subrow++
			settings.subtitles = subArr[(subrow%12)]
		}
		draw();
	}

	else if(key.name == "down") {
		if (cursorcol%11 === 0) {
			searchrow--
		}
		else if (cursorcol%11 === 1) {
			keywordrow--; 
		}
		else if (cursorcol%11 === 2) {
			watchrow--
		}
		else if (cursorcol%11 === 6) {
			resetInput()
			playerrow--
			settings.player = playerArr[(playerrow%11)]
		}
		else if (cursorcol%11 === 9) {
			resetInput()
			subrow--
			settings.subtitles = subArr[(subrow%12)]
		}
		draw()
	}
	
	else if(key.name == "right") {cursorcol++; draw();}
	
	else if(key.name == "left") {cursorcol--; draw();}
	
	else if(key.name == "return") {
		if (cursorcol%11 === 0 || cursorcol%11 === 1) {
			options.query = searchStr.trim()
			options.keyword = keywordArr[keywordrow%5]
			mgSrch.clearattr()
			lastSearched = searchStr
			if(searchArr[searchrow%4]==="PIRATEBAY") {
				argv.s = "tpb"
			} else if(searchArr[searchrow%4]==="KICKASS") {
				argv.s = "kat"
			} else if(searchArr[searchrow%4]==="DEMONOID") {
				argv.s = "demon"
			}
			else {
				argv.s = "btd"
			}
			watchrow = 1500
			resetInput()
			search()
		}
		else if (cursorcol%11 === 2) {
			launchPF()
		}
		else if (cursorcol%11 === 3) {
			options.socks.port = searchStr
			settings.post = options.socks.port
			resetInput()
			draw()
		}
		else if (cursorcol%11 === 4) {
			options.socks.host = searchStr
			settings.host = options.socks.host
			resetInput()
			draw()
		}
		else if (cursorcol%11 === 5) {
			if(options.socks.enabled === false) {
				options.socks.enabled = true
			}
			else {
				options.socks.enabled = false
			}
			resetInput()
			draw()
		}
		else if (cursorcol%11 === 6) {
			settings.player = playerArr[(playerrow++)%10]
			resetInput()
			draw()
		}
		else if (cursorcol%11 === 7) {
			if(searchStr.trim() === "") {
				settings.blocklist = undefined
			} else {
				settings.blocklist = searchStr
			}
			resetInput()
			draw()
		}
		else if (cursorcol%11 === 8) {
			if(settings.printmag === false) {
				settings.printmag = true
			}
			else {
				settings.printmag = false
			}
			resetInput()
			draw()
		}
		else if (cursorcol%11 === 10) {
			if(searchStr.trim() === "") {
				settings.path = "tmp"
			} else {
				settings.path = searchStr
			}
			resetInput()
			draw()
		}
	}
	else {
		if(cursorcol%11 === 0 || cursorcol%11 === 1 || cursorcol%11 === 3 || cursorcol%11 === 4 || cursorcol%11 === 5 || cursorcol%11 === 7 || cursorcol%11 === 10) {
			searchStr += chunk
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			if(cursorcol%11 === 0 || cursorcol%11 === 1) {
				process.stdout.write(" Search:"+ searchStr)
			} else {
				process.stdout.write(" Input:"+ searchStr)
			}
		}
	}
})

function resetInput() {
	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	searchStr = ""
}
