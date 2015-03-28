var request = require('request')
var cheerio = require('cheerio')
var health = require('torrent-health')
var agent = require('socks5-http-client/lib/Agent')

var options = {}
var sHost = "127.0.0.1"
var sPort = 9050

var attr = {
		title: [],
		mag: [],
		seeders: [],
		peers: [],
		leechers: []
}

function parsequery(str) {
	var ret = ""
	for(var tmp=0; tmp<str.length; tmp++) {
		if(str.charAt(tmp) === ' ') {
			ret+='%20'
		}
		else if(tmp === str.length-1) {
			ret+=str.charAt(tmp)
			return ret
		}
		else {
			ret+=str.charAt(tmp)
		}
	}
}

exports.clearattr = function() {
	attr.title = []
	attr.mag = []
	attr.seeders = []
	attr.peers = []
	attr.leechers = []
}

exports.getattr = function() {
	return attr
}

outoftime = function() {
	console.log("\nResponse timeout!\nIf you are using a socks make sure it is configured properly.\n")
	process.exit(0)
}

exports.feelingLucky = function(params, callback) {
	
	var ss=parsequery(params.query)
	
	if(params.socks.port !== undefined) {
		sPort = params.socks.port
	}
	if(params.socks.host !== undefined) {
		sHost = params.socks.host
	}
	if(params.socks.port) {
		if(sPort === 9150 || sPort === 9050) {
			options = {
					url: 'http://btdigg63cdjmmmqj.onion/search?q='+ss+'&p=0&order=0',
					agentClass: agent,
					agentOptions: {
						socksHost: sHost, // Defaults to 'localhost'.
						socksPort: sPort, // Defaults to 1080.
						rejectUnauthorized: false
					}
			}
		}
		else {
			options = {
					url: 'http://btdigg.org/search?q='+ss+'&p=0&order=0',
					agentClass: agent,
					agentOptions: {
						socksHost: sHost, // Defaults to 'localhost'.
						socksPort: sPort, // Defaults to 1080.
						rejectUnauthorized: false
					}
			}
		}
	}
	else {
		options = {url: 'http://btdigg.org/search?q='+ss+'&p=0&order=0'};
	}

	timer = setTimeout(outoftime, 18000)
	//var trackers = "&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969"
	request(options, function(error, response, html) {
		clearTimeout(timer)
		if(html === undefined) {
			console.log("\nResponse is empty!\nIf you are using a Socks, make sure it is properly configured.\n")
			process.exit(0)
		}
		
		if(!error) {
			var i=0
			var $ = cheerio.load(html)
			attr.title.push($('.torrent_name_tbl').first().text())
			attr.mag.push($('.ttth').first().find('a').filter("[href]").attr('href'))
			return callback(attr)
		}
	})
}

exports.oldpbay = function(params, callback) {
	var qq=parsequery(params.query)
	var kk=""

	switch(params.keyword) {
	case "all":
		kk=0
		break
	case "video":
		kk=5
		break
	case "audio":
		kk=6
		break
	case "adult":
		kk=4
		break
	case "applications":
		kk=2
		break
	}

	options = {url: 'https://oldpiratebay.org/search?q='+qq+'&sort=-seeders&page='+params.page+'&per-page=15&iht='+kk }
	
	request(options, function(error, response, html) {

		if(!error) {
			var $ = cheerio.load(html);
			$('.table-responsive').filter(function() {
				var first = $(this).children().first()
				$('tr', first).each(function(a, b) {
					if(a!==0) {
						attr.title.push($(this).children().eq(1).text().trim() + "\nSize: " + $(this).children().eq(3).text())
						attr.mag.push($(this).children().eq(1).find('a').filter("[href]").eq(2).attr('href'))
						attr.seeders.push("Seeders: " + $(this).children().eq(4).text())
						attr.leechers.push("Leechers: " + $(this).children().eq(5).text())
					}
				});
			});
		}
		return callback(attr)
	});
};

exports.pbay = function(params, callback) {
	
	var qq=parsequery(params.query)
	var kk=""

	switch(params.keyword) {
	case "all":
		kk=0
		break
	case "video":
		kk=200
		break
	case "audio":
		kk=100
		break
	case "adult":
		kk=500
		break
	case "applications":
		kk=300
		break
	}

	
	if(Boolean(params.socks.enabled)) {
		if(parseInt(params.socks.port) === 9150 || parseInt(params.socks.port) === 9050) {
			options = {
					url: 'http://uj3wazyk5u4hnvtk.onion/search/'+qq+'/'+(params.page/2)+'/7/'+kk,
					agentClass: agent,
					agentOptions: {
						socksHost: params.socks.host, // Defaults to 'localhost'.
						socksPort: parseInt(params.socks.port), // Defaults to 1080.
						rejectUnauthorized: false
					}
			}
		}
		else {
			options = {
					url: 'http://thepiratebay.se/search/'+qq+'/'+(params.page/2)+'/7/'+kk,
					agentClass: agent,
					agentOptions: {
						socksHost: params.socks.host, // Defaults to 'localhost'.
						socksPort: parseInt(params.socks.port), // Defaults to 1080.
						rejectUnauthorized: false
					}
			}
		}
	}
	else {
		options = {url: 'http://thepiratebay.se/search/'+qq+'/'+(params.page/2)+'/7/'+kk}
	}
	
	request(options, function(error, response, html) {
		var i = 0
		if(error) {
			return callback(error)
		}
		
		if(!error){
			var $ = cheerio.load(html)
			$('#searchResult').filter(function() {
				var tr = $(this).children('tr')
				var magLink = ""
				var lowlim = (((params.page%2))*60)
				var uplim = (((params.page%2)+1)*60)+1 //reduce output from 30 to 15.
				$('td', tr).each(function(a, b) {

					//title & mag
					if(a%4===1 && a<uplim && a>lowlim) {
						var size = $(b).children().eq(4).text().substr(25)
						size = size.slice(0,size.indexOf(","))
						attr.title.push($(b).children().eq(0).text().trim() + size)
						magLink = $('a', this).eq(1).filter("[href]").attr('href')
						attr.mag.push(magLink)
					}
					//seeders
					if(a%4===2 && a<uplim && a>lowlim) {
						attr.seeders.push(" "+$(b).text())
					}
					//leekers
					if(a%4===3 && a<uplim && a>lowlim) {
						attr.leechers.push(" "+$(b).text())
					}
				})
			})
		}
		return callback(attr)
	})
}

exports.btdigg = function(params, callback) {
	var qq=parsequery(params.query)

	if(Boolean(params.socks.enabled)) {
		if(parseInt(params.socks.port) === 9150 || parseInt(params.socks.port) === 9050) {
			options = {
					url: 'http://btdigg63cdjmmmqj.onion/search?q='+qq+'&p='+params.page+'&order=0',
					agentClass: agent,
					agentOptions: {
						socksHost: sHost, // Defaults to 'localhost'.
						socksPort: parseInt(params.socks.port), // Defaults to 1080.
						rejectUnauthorized: false
					}
			}
		}
		else {
			options = {
					url: 'http://btdigg.org/search?q='+qq+'&p='+params.page+'&order=0',
					agentClass: agent,
					agentOptions: {
						socksHost: sHost, // Defaults to 'localhost'.
						socksPort: parseInt(params.socks.port), // Defaults to 1080.
						rejectUnauthorized: false
					}
			}
		}
	}
	else {
		options = {url: 'http://btdigg.org/search?q='+qq+'&p='+params.page+'&order=0'}
	}

	
	request(options, function(error, response, html) {
		
		if(error) {
			return callback(error)
		}
		
		if(!error) {
			var $ = cheerio.load(html)
			$('.torrent_name_tbl').filter(function(c) {
				if(c%2===0) {
					var temp = $(this).text().trim()
					var tr = $(this).next().children('tr').first()
					$('td', tr).each(function(a, b) {
							if(a===2) {
								temp += " "+$('.attr_val', b).text().trim()
							}
					});
					attr.title.push(temp)
				}
			})
			$('.ttth').filter(function(c){
				if(c%2===0) {
					attr.mag.push($('a', this).filter("[href]").attr('href'))
				}
			})
		}
		return callback(attr)
	});
};

exports.torhound = function(params, callback) {
	var qq=parsequery(params.query)

	options = {url: 'http://www.torrenthound.com/search/'+params.page+'/'+qq+'/seeds:desc' }

	request(options, function(error, response, html) {

		if(!error){
			var $ = cheerio.load(html)
			$('.searchtable').filter(function(n){
				if(n === 1) {
					$('tr', $(this)).each(function(a, b) {
						if (a!==0) {
							attr.title.push($(this).find('a').filter("[href]").text().substr(2)+"\nUploaded "+$(this).children().eq(1).children().find('span').text()+", Size "+$(this).children().eq(2).text())
							attr.mag.push($(this).find('a').filter("[href]").eq(0).attr('href'))
							attr.seeders.push("Seeders: " +  $(this).find('td').eq(3).text())
							attr.leechers.push("Leechers:" +  $(this).find('td').eq(4).text())
						}
					})
				}
			})
		}
		return callback(attr)
	})
}

