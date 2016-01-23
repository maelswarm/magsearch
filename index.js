var magsearch = module.exports = {};
var request = require('request')
var cheerio = require('cheerio')
var health = require('./torrent-health-hf')
var agent = require('socks5-http-client/lib/Agent')

var options = {}
var sHost = "127.0.0.1"
var sPort = 9050

magsearch.attr = {
		title: [],
		mag: [],
		size: [],
		seeders: [],
		peers: [],
		leechers: [],
		url: ""
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

magsearch.gethealth = function(i, callback) {
	var a = i
	health(magsearch.attr.mag[a])
	.then(function(health) {
		magsearch.attr.seeders[a] = " " + health.seeds
		magsearch.attr.peers[a] = " " + health.peers
		return callback(1);
	})
	.catch(function (err) {
		console.error(err)
		return callback(1);
	})
}


magsearch.clearattr = function() {
	magsearch.attr.title = []
	magsearch.attr.mag = []
	magsearch.attr.seeders = []
	magsearch.attr.peers = []
	magsearch.attr.leechers = []
	magsearch.attr.size = []
	magsearch.attr.url = ""
}

outoftime = function() {
	console.log("\nResponse timeout!\nIf you are using a socks make sure it is configured properly.\n")
	process.exit(0)
}

magsearch.pbay = function(params, callback) {
	
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
					url: 'http://uj3wazyk5u4hnvtk.onion/search/'+qq+'/'+Math.floor(params.page/2)+'/7/'+kk,
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
					url: 'http://thepiratebay.se/search/'+qq+'/'+Math.floor(params.page/2)+'/7/'+kk,
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
		options = {url: 'http://thepiratebay.se/search/'+qq+'/'+Math.floor(params.page/2)+'/7/'+kk}
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
					magsearch.attr.peers.push(" ")
					//title & mag
					if(a%4===1 && a<uplim && a>lowlim) {
						var childs = $(b).children()
						var size = childs.eq(4).text().substr(26)
						size = size.slice(0, size.indexOf(","))
						magsearch.attr.size.push(size)
						magsearch.attr.title.push(childs.eq(0).text().trim().replace("{", "").replace("}", ""))
						magLink = $('a', this).eq(1).filter("[href]").attr('href')
						magsearch.attr.mag.push(magLink)
					}
					//seeders
					if(a%4===2 && a<uplim && a>lowlim) {
						magsearch.attr.seeders.push(" "+$(b).text())
					}
					//leekers
					if(a%4===3 && a<uplim && a>lowlim) {
						magsearch.attr.leechers.push(" "+$(b).text())
					}
				})
			})
		}
		magsearch.attr.url = options.url
		return callback(magsearch.attr)
	})
}

magsearch.demon = function(params, callback) {
	
	var qq=parsequery(params.query)
	var kk=""

	switch(params.keyword) {
	case "all":
		kk=0
		break
	case "video":
		kk=1
		break
	case "audio":
		kk=2
		break
	case "adult":
		kk=1
		break
	case "applications":
		kk=5
		break
	}

	
	if(Boolean(params.socks.enabled)) {
		if(parseInt(params.socks.port) === 9150 || parseInt(params.socks.port) === 9050) {
			options = {
					host: 'http://demonhkzoijsvvui.onion',
					url: 'http://demonhkzoijsvvui.onion/files/?query='+qq+'&subcategory=All&quality=All&seeded=2&external=2&sort=S&category='+kk+'&page='+Math.floor((params.page/4)+1),
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
					host: 'http://www.demonoid.pw',
					url: 'http://www.demonoid.pw/files/?query='+qq+'&subcategory=All&quality=All&seeded=2&external=2&sort=S&category='+kk+'&page='+Math.floor((params.page/4)+1),
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
		options = {
				host: 'http://www.demonoid.pw',
				url: 'http://www.demonoid.pw/files/?query='+qq+'&subcategory=All&quality=All&seeded=2&external=2&sort=S&category='+kk+'&page='+Math.floor((params.page/4)+1)}
	}
	
	request(options, function(error, response, html) {
		var i = 0
		if(error) {
			return callback(error)
		}
		
		if(!error){
			//console.log(options.url)
			var $ = cheerio.load(html)
			var upperlim = 4+(Math.floor((params.page%4)+1)*45)
			var lowerlim = 3+(Math.floor(params.page%4)*45)
			$('.ctable_content_no_pad').filter(function() {
				var tmp = $(this).eq(0).eq(0)
				$('tr', tmp).each(function(a, b) {
					if((a<upperlim) && (a>lowerlim)) {
						var childs = $(b).children('td')
						if((a-4)%3==1) {
							magsearch.attr.title.push($(this).text().trim())
						} else if((a-4)%3==2) {
							magsearch.attr.leechers.push(" "+childs.eq(7).text())
							magsearch.attr.seeders.push(" "+childs.eq(6).text())
							magsearch.attr.size.push(" "+childs.eq(3).text())
							magsearch.attr.mag.push(options.host+childs.eq(2).children().eq(1).filter("[href]").attr('href'))
						}
					}
				})
			})
		}
		magsearch.attr.url = options.url
		return callback(magsearch.attr)
	})
}

magsearch.kat = function(params, callback) {
	
	var qq=parsequery(params.query)
	var kk=""

	switch(params.keyword) {
	case "all":
		kk=""
		break
	case "video":
		kk="%20category%3Amovies"
		break
	case "audio":
		kk="%20category%3Amusic"
		break
	case "adult":
		kk="%20category%3Axxx"
		break
	case "applications":
		kk="%20category%3Aapplications"
		break
	}

//	http://www.katproxyabq6ezj6.onion/usearch/blade%20runner/2/
//	http://www.katproxyabq6ezj6.onion/usearch/blade%20runner%20category%3Amovies/1/
//	http://www.katproxyabq6ezj6.onion/usearch/blade%20runner%20category%3Amovies/1/
	
//	'http://www.kat.cr/usearch/'+qq+kk+'/'+(params.page+1)+'/'
	
//	if(Boolean(params.socks.enabled)) {
//		if(parseInt(params.socks.port) === 9150 || parseInt(params.socks.port) === 9050) {
//			options = {
//					url: 'http://www.katproxyabq6ezj6.onion/json.php?q='+qq,
//					agentClass: agent,
//					agentOptions: {
//						socksHost: params.socks.host, // Defaults to 'localhost'.
//						socksPort: parseInt(params.socks.port), // Defaults to 1080.
//						rejectUnauthorized: false
//					}
//			}
//		}
//		else {
//			options = {
//					url: 'http://www.kat.cr/json.php?q='+qq,
//					agentClass: agent,
//					agentOptions: {
//						socksHost: params.socks.host, // Defaults to 'localhost'.
//						socksPort: parseInt(params.socks.port), // Defaults to 1080.
//						rejectUnauthorized: false
//					}
//			}
//		}
//	}
//	else {
		options = {url: 'http://www.kat.cr/json.php?q='+qq}
//	}
	
	request(options, function(error, response, html) {
		var i = 0
		if(error) {
			return callback(error)
		}

		if(!error){
			var data = JSON.parse(html)
			//console.log(data.list[0]);
			
			for(var i=params.page*15; i<(params.page+1)*15; i++) {
				magsearch.attr.title.push(data.list[i].title.trim())
				magsearch.attr.mag.push(data.list[i].torrentLink)
				magsearch.attr.seeders.push(" "+data.list[i].seeds)
				magsearch.attr.leechers.push(" "+data.list[i].leechs)
				magsearch.attr.peers.push(" "+data.list[i].peers)
				magsearch.attr.size.push((data.list[i].size/1000000000).toFixed(2)+" GiB")
			}
		}
		magsearch.attr.url = options.url
		return callback(magsearch.attr)
	})
}

magsearch.btdigg = function(params, callback) {
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
					
					magsearch.attr.title.push(temp)
				} else {
					var temp = $(this).children('tr').children('td').eq(1).text()
					magsearch.attr.size.push(temp)
				}
			})
			$('.ttth').filter(function(c){
				magsearch.attr.mag.push($('a', this).filter("[href]").attr('href'))
			})
		}
		magsearch.attr.url = options.url
		return callback(magsearch.attr)
	});
};