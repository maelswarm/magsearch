const magsearch = (module.exports = {});
const request = require('request');
const cheerio = require('cheerio');
const health = require('./torrent-health-hf');
const agent = require('socks5-http-client/lib/Agent');

let options = {};
const sHost = '127.0.0.1';
const sPort = 9050;

magsearch.attr = {
  title: [],
  mag: [],
  size: [],
  seeders: [],
  peers: [],
  leechers: [],
  url: ''
};

function parsequery(str) {
  let ret = '';
  for (let tmp = 0; tmp < str.length; tmp++) {
    if (str.charAt(tmp) === ' ') {
      ret += '%20';
    } else if (tmp === str.length - 1) {
      ret += str.charAt(tmp);
      return ret;
    } else {
      ret += str.charAt(tmp);
    }
  }
}

magsearch.gethealth = function(i, callback) {
  const a = i;
  health(magsearch.attr.mag[a])
    .then(function(health) {
      magsearch.attr.seeders[a] = ' ' + health.seeds;
      magsearch.attr.peers[a] = ' ' + health.peers;
      return callback(1);
    })
    .catch(function(err) {
      console.error(err);
      return callback(1);
    });
};

magsearch.clearattr = function() {
  magsearch.attr.title = [];
  magsearch.attr.mag = [];
  magsearch.attr.seeders = [];
  magsearch.attr.peers = [];
  magsearch.attr.leechers = [];
  magsearch.attr.size = [];
  magsearch.attr.url = '';
};

outoftime = function() {
  console.log(
    '\nResponse timeout!\nIf you are using a socks make sure it is configured properly.\n'
  );
  process.exit(0);
};

magsearch.pbay = function(params, callback) {
  const qq = parsequery(params.query);
  let kk = '';

  switch (params.keyword) {
    case 'all':
      kk = 0;
      break;
    case 'video':
      kk = 200;
      break;
    case 'audio':
      kk = 100;
      break;
    case 'adult':
      kk = 500;
      break;
    case 'applications':
      kk = 300;
      break;
  }

  if (Boolean(params.socks.enabled)) {
    if (
      parseInt(params.socks.port) === 9150 ||
      parseInt(params.socks.port) === 9050
    ) {
      options = {
        url: `http://uj3wazyk5u4hnvtk.onion/search/${qq}/${Math.floor(
          params.page / 2
        )}/7/${kk}`,
        agentClass: agent,
        agentOptions: {
          socksHost: params.socks.host, // Defaults to 'localhost'.
          socksPort: parseInt(params.socks.port), // Defaults to 1080.
          rejectUnauthorized: false
        }
      };
    } else {
      options = {
        url: `https://thepiratebay.org/search/${qq}/${Math.floor(
          params.page / 2
        )}/7/${kk}`,
        agentClass: agent,
        agentOptions: {
          socksHost: params.socks.host, // Defaults to 'localhost'.
          socksPort: parseInt(params.socks.port), // Defaults to 1080.
          rejectUnauthorized: false
        }
      };
    }
  } else {
    options = {
      url:
        'https://thepiratebay.org/search/' +
        qq +
        '/' +
        Math.floor(params.page / 2) +
        '/7/' +
        kk
    };
  }

  request(options, function(error, response, html) {
    let i = 0;
    if (error) {
      return callback(error);
    }

    if (!error) {
      const $ = cheerio.load(html);
      $('#searchResult').filter(function() {
        let tr = $(this).children('tr');
        let magLink = '';
        const lowlim = (params.page % 2) * 60;
        const uplim = (params.page % 2 + 1) * 60 + 1; //reduce output from 30 to 15.
        $('td', tr).each(function(a, b) {
          magsearch.attr.peers.push(' ');
          //title & mag
          if (a % 4 === 1 && a < uplim && a > lowlim) {
            const childs = $(b).children();
            let size = childs
              .eq(4)
              .text()
              .substr(26);
            size = size.slice(0, size.indexOf(','));
            magsearch.attr.size.push(size);
            magsearch.attr.title.push(
              childs
                .eq(0)
                .text()
                .trim()
                .replace('{', '')
                .replace('}', '')
            );
            magLink = $('a', this)
              .eq(1)
              .filter('[href]')
              .attr('href');
            magsearch.attr.mag.push(magLink);
          }
          //seeders
          if (a % 4 === 2 && a < uplim && a > lowlim) {
            magsearch.attr.seeders.push(' ' + $(b).text());
          }
          //leekers
          if (a % 4 === 3 && a < uplim && a > lowlim) {
            magsearch.attr.leechers.push(' ' + $(b).text());
          }
        });
      });
    }
    magsearch.attr.url = options.url;
    return callback(magsearch.attr);
  });
};

//magsearch.demon = function(params, callback) {
//
//	var qq=parsequery(params.query)
//	var kk=""
//
//	switch(params.keyword) {
//	case "all":
//		kk=0
//		break
//	case "video":
//		kk=1
//		break
//	case "audio":
//		kk=2
//		break
//	case "adult":
//		kk=1
//		break
//	case "applications":
//		kk=5
//		break
//	}
//
//
//	if(Boolean(params.socks.enabled)) {
//		if(parseInt(params.socks.port) === 9150 || parseInt(params.socks.port) === 9050) {
//			options = {
//					host: 'http://demonhkzoijsvvui.onion',
//					url: 'http://demonhkzoijsvvui.onion/files/?query='+qq+'&subcategory=All&quality=All&seeded=2&external=2&sort=S&category='+kk+'&page='+Math.floor((params.page/4)+1),
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
//					host: 'https://www.demonoid.pw',
//					url: 'https://www.demonoid.pw/files/?query='+qq+'&subcategory=All&quality=All&seeded=2&external=2&sort=S&category='+kk+'&page='+Math.floor((params.page/4)+1),
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
//		options = {
//				host: 'https://www.demonoid.pw',
//				url: 'https://www.demonoid.pw/files/?query='+qq+'&subcategory=All&quality=All&seeded=2&external=2&sort=S&category='+kk+'&page='+Math.floor((params.page/4)+1)}
//	}
//
//	request(options, function(error, response, html) {
//		var i = 0
//		if(error) {
//			return callback(error)
//		}
//
//		if(!error) {
//			//console.log(options.url)
//			var $ = cheerio.load(html)
//			var upperlim = 4+(Math.floor((params.page%4)+1)*45)
//			var lowerlim = 3+(Math.floor(params.page%4)*45)
////			$('.tone_1_pad').filter(function() {
//				magsearch.attr.title.push($('.tone_1_pad'))
////			});
//
////			$('.ctable_content_no_pad').filter(function() {
////				var tmp = $(this).eq(0).eq(0)
////				$('tr', tmp).each(function(a, b) {
////					if((a<upperlim) && (a>lowerlim)) {
////						var childs = $(b).children('td')
////						if((a-4)%3==1) {
////							magsearch.attr.title.push($(this).text().trim())
////						} else if((a-4)%3==2) {
////							magsearch.attr.leechers.push(" "+childs.eq(7).text())
////							magsearch.attr.seeders.push(" "+childs.eq(6).text())
////							magsearch.attr.size.push(" "+childs.eq(3).text())
////							magsearch.attr.mag.push(options.host+childs.eq(2).children().eq(1).filter("[href]").attr('href'))
////						}
////					}
////				})
////			})
//		}
//		magsearch.attr.url = options.url
//		return callback(magsearch.attr)
//	})
//}

//magsearch.kat = function(params, callback) {
//
//	var qq=parsequery(params.query)
//	var kk=""
//
//		switch(params.keyword) {
//		case "all":
//			kk=""
//				break
//		case "video":
//			kk="%20category%3Amovies"
//				break
//		case "audio":
//			kk="%20category%3Amusic"
//				break
//		case "adult":
//			kk="%20category%3Axxx"
//				break
//		case "applications":
//			kk="%20category%3Aapplications"
//				break
//		}
//
//	options = {url: 'https://katcr.co/new/search-torrents.php?search=' + qq + '&sort=seeders&order=desc'}
//
//	request(options, function(error, response, html) {
//		var i = 0
//		if(error) {
//			return callback(error)
//		}
//
//		if(!error) {
//			var $ = cheerio.load(html);
//			$('.cellMainLink').each(function() {
//				magsearch.attr.title.push($(this).text().trim());
//			});
//			$('.ttable_col2').each(function(i) {
//				if(i%2 == 1) {
//					magsearch.attr.seeders.push(" "+$(this).eq(0).text().trim());
//					magsearch.attr.leechers.push(" "+$(this).next().eq(0).text().trim());
//				} else {
//					magsearch.attr.size.push($(this).eq(0).text().trim());
//				}
//			});
//		}
//		magsearch.attr.url = options.url
//		return callback(magsearch.attr)
//	})
//}

//magsearch.btdigg = function(params, callback) {
//	var qq=parsequery(params.query)
//
//	if(Boolean(params.socks.enabled)) {
//		if(parseInt(params.socks.port) === 9150 || parseInt(params.socks.port) === 9050) {
//			options = {
//					url: 'http://btdigg63cdjmmmqj.onion/search?q='+qq+'&p='+params.page+'&order=0',
//					agentClass: agent,
//					agentOptions: {
//						socksHost: sHost, // Defaults to 'localhost'.
//						socksPort: parseInt(params.socks.port), // Defaults to 1080.
//						rejectUnauthorized: false
//					}
//			}
//		}
//		else {
//			options = {
//					url: 'http://btdig.com/search?q='+qq+'&p='+params.page+'&order=0',
//					agentClass: agent,
//					agentOptions: {
//						socksHost: sHost, // Defaults to 'localhost'.
//						socksPort: parseInt(params.socks.port), // Defaults to 1080.
//						rejectUnauthorized: false
//					}
//			}
//		}
//	}
//	else {
//		options = {url: 'http://btdig.com/search?q='+qq+'&p='+params.page+'&order=0'}
//	}
//
//
//	request(options, function(error, response, html) {
//
//		if(error) {
//			return callback(error)
//		}
//
//		if(!error) {
//			var $ = cheerio.load(html)
//			$('.torrent_name_tbl').filter(function(c) {
//				if(c%2===0) {
//					var temp = $(this).text().trim()
//					var tr = $(this).next().children('tr').first()
//
//					magsearch.attr.title.push(temp)
//				} else {
//					var temp = $(this).children('tr').children('td').eq(1).text()
//					magsearch.attr.size.push(temp)
//				}
//			})
//			$('.ttth').filter(function(c){
//				magsearch.attr.mag.push($('a', this).filter("[href]").attr('href'))
//			})
//		}
//		magsearch.attr.url = options.url
//		return callback(magsearch.attr)
//	});
//};
