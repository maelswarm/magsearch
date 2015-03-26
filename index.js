var request = require('request')
var cheerio = require('cheerio')
var zlib = require('zlib');
var health = require('torrent-health')
var agent = require('socks5-http-client/lib/Agent')

var retArr = []
var options = {}
var sHost = "127.0.0.1"
var sPort = 9050

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

exports.feelingLucky = function(s, t, socks, callback) {
	var ss=parsequery(s)

	if(socks[0] !== undefined) {
		sPort = socks[0]
		console.log("BLAH");
	}
	if(socks[1] !== undefined) {
		sHost = socks[1]
	}
	if(t) {
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

	request(options, function(error, response, html) {
		if(html === undefined) {
			console.log("\nResponse is empty!\nIf you are using a Socks, make sure it is properly configured.")
		}
		if(!error) {
			var i=0
			var $ = cheerio.load(html)
			retArr.push($('.torrent_name_tbl').first().text())
			retArr.push($('.ttth').first().find('a').filter("[href]").attr('href'))
			return callback(retArr)
		}
	})
}

exports.oldpbay = function(q, p, k, callback) {
	
	var qq=parsequery(q)
	var kk=""

	switch(k) {
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

	options = {url: 'https://oldpiratebay.org/search?q='+qq+'&sort=-seeders&page='+p+'&per-page=15&iht='+kk }
	
	request(options, function(error, response, html) {
		var title = []
		var seeders = []
		var leechers = []
		var mag = []
		if(!error) {
			var $ = cheerio.load(html);
			$('.table-responsive').filter(function() {
				var first = $(this).children().first()
				$('tr', first).each(function(a, b) {
					title.push($(this).children().eq(1).text().trim() + "\nSize: " + $(this).children().eq(3).text())
					mag.push($(this).children().eq(1).find('a').filter("[href]").eq(2).attr('href'))
					seeders.push("Seeders: " + $(this).children().eq(4).text())
					leechers.push("Leechers: " + $(this).children().eq(5).text())
				});
			});
		}
		retArr[0]=title
		retArr[1]=mag
		retArr[2]=seeders
		retArr[3]=leechers
		return callback(retArr)
	});
};

exports.pbay = function(q, p, k, t, socks, callback) {
	var qq=parsequery(q)
	var kk=""

	switch(k) {
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

	if(socks[0]) {
		sPort = socks[0]
	}
	if(socks[1]) {
		sHost = socks[1]
	}

	if(t) {
		if(sPort === 9150 || sPort === 9050) {
			options = {
					url: 'http://uj3wazyk5u4hnvtk.onion/search/'+qq+'/'+p+'/7/'+kk,
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
					url: 'http://thepiratebay.se/search/'+qq+'/'+p+'/7/'+kk,
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
		options = {url: 'http://thepiratebay.se/search/'+qq+'/'+(p/2)+'/7/'+kk}
	}

	request(options, function(error, response, html) {
		var title = []
		var seeders = []
		var leechers = []
		var mag = []
		var peers = []
		var i = 0
		if(html === undefined) {
			console.log("\nResponse is empty!\nIf you are using a socks make sure it is configured properly.")
		}
		if(!error){
			var $ = cheerio.load(html)
			$('#searchResult').filter(function() {
				var tr = $(this).children('tr')
				var magLink = ""
				var lowlim = (((p%2))*60)
				var uplim = (((p%2)+1)*60)+1 //reduce output from 30 to 15.
				$('td', tr).each(function(a, b) {

					//title & mag
					if(a%4===1 && a<uplim && a>lowlim) {
						title.push($(b).children().eq(0).text().trim() +"\n"+ $(b).children().eq(4).text())
						magLink = $('a', this).eq(1).filter("[href]").attr('href')
						mag.push(magLink)
					}
					//seeders
					if(a%4===2 && a<uplim && a>lowlim) {
						health(magLink)
						.then(function(health) {
							i++
							seeders.push("Seeders: " + health.seeds)
							peers.push("Peers: " + health.peers)
							if(i === ($('td', tr).length)/8) {
								retArr[0]=title
								retArr[1]=mag
								retArr[2]=seeders
								retArr[3]=leechers
								retArr[4]=peers
								return callback(retArr)
							}
						})
						.catch(function (err) {
							console.error(err)
						});
					}
					//leekers
					if(a%4===3 && a<uplim && a>lowlim) {
						leechers.push("Leechers: " + $(b).text())
					}
				})
			})
		}
	})
}

exports.btdigg = function(q, p, t, socks, callback) {
	
	var qq=parsequery(q)

	if(socks[0] !== undefined) {
		sPort = socks[0]
	}
	if(socks[1] !== undefined) {
		sHost = socks[1]
	}

	if(t) {
		if(sPort === 9150 || sPort === 9050) {
			options = {
					url: 'http://btdigg63cdjmmmqj.onion/search?q='+qq+'&p='+p+'&order=0',
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
					url: 'http://btdigg.org/search?q='+qq+'&p='+p+'&order=0',
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
		options = {url: 'http://btdigg.org/search?q='+qq+'&p='+p+'&order=0'}
	}

	request(options, function(error, response, html) {
		var title = []
		var dsc = []
		var mag = []
		if(html === undefined) {
			console.log("\nResponse is empty!\nIf you are using a socks make sure it is configured properly.")
		}
		if(!error) {
			var $ = cheerio.load(html)
			var i=0
			$('.torrent_name_tbl').filter(function() {
				if(i%2===0) {
					title.push($(this).text())
				}
				else {
					var tr = $(this).children('tr').first()
					var attr=""
						$('td', tr).each(function(a, b) {
							if(a>1&&8>a) {
								attr += $('.attr_name', b).text() + $('.attr_val', b).text()
								attr += " "
							}
						});
					dsc.push(attr)
				}
				i++
			})
			i=0
			$('.ttth').filter(function(){
				if(i%2===0) {
					mag.push($('a', this).filter("[href]").attr('href'))
				}
				i++
			})
		}
		retArr[0]=title
		retArr[1]=mag
		retArr[2]=dsc
		return callback(retArr)
	});
};

//exports.kickass = function(q, p, callback) {
//	var qq=parsequery(q)
//
//	options = {url: 'http://kickass.to/json.php?q='+qq+'&field=seeders&order=desc&page='+p }
//	
//	request(options, function(error, response, html) {
//		var title = []
//		var seeders = []
//		var leechers = []
//		var mag = []
//		if(!error){
//			var jSon = JSON.parse(html);
//			console.log(jSon.list[30]);
//			for(var i=0; jSon.list[i]!==undefined; i++) {
//				title.push(jSon.list.title+"\nUploaded "+$(this).children().eq(1).children().find('span').text()+", Size "+$(this).children().eq(2).text())
////				mag.push($(this).find('a').filter("[href]").eq(0).attr('href'))
////				seeders.push("Seeders: " +  $(this).find('td').eq(3).text())
////				leechers.push("Leechers:" +  $(this).find('td').eq(4).text())
//			}
////			$('.searchtable').filter(function(n){
////				if(n === 1) {
////					$('tr', $(this)).each(function(a, b) {
////						if (a!==0) {
////							title.push($(this).find('a').filter("[href]").text().substr(2)+"\nUploaded "+$(this).children().eq(1).children().find('span').text()+", Size "+$(this).children().eq(2).text())
////							mag.push($(this).find('a').filter("[href]").eq(0).attr('href'))
////							seeders.push("Seeders: " +  $(this).find('td').eq(3).text())
////							leechers.push("Leechers:" +  $(this).find('td').eq(4).text())
////						}
////					})
////				}
////			})
//		}
//		retArr[0]=title
//		retArr[1]=mag
//		retArr[2]=seeders
//		retArr[3]=leechers
//		return callback(retArr)
//	})
//}

exports.torhound = function(q, p, callback) {
	
	var qq=parsequery(q)

	options = {url: 'http://www.torrenthound.com/search/'+p+'/'+qq+'/seeds:desc' }

	request(options, function(error, response, html) {
		var title = []
		var seeders = []
		var leechers = []
		var mag = []
		if(!error){
			var $ = cheerio.load(html)
			$('.searchtable').filter(function(n){
				if(n === 1) {
					$('tr', $(this)).each(function(a, b) {
						if (a!==0) {
							title.push($(this).find('a').filter("[href]").text().substr(2)+"\nUploaded "+$(this).children().eq(1).children().find('span').text()+", Size "+$(this).children().eq(2).text())
							mag.push($(this).find('a').filter("[href]").eq(0).attr('href'))
							seeders.push("Seeders: " +  $(this).find('td').eq(3).text())
							leechers.push("Leechers:" +  $(this).find('td').eq(4).text())
						}
					})
				}
			})
		}
		retArr[0]=title
		retArr[1]=mag
		retArr[2]=seeders
		retArr[3]=leechers
		return callback(retArr)
	})
}

