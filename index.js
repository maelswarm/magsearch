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
        url: `http://piratebayo3klnzokct3wt5yyxb2vpebbuyjl7m623iaxmqhsd52coid.onion/search/${qq}/${Math.floor(
          params.page / 2
        )}/99/${kk}`,
        agentClass: agent,
        agentOptions: {
          socksHost: params.socks.host, // Defaults to 'localhost'.
          socksPort: parseInt(params.socks.port), // Defaults to 1080.
          rejectUnauthorized: false
        }
      };
    } else {
      options = {
        url: `https://thepiratebay0.org/search/${qq}/${Math.floor(
          params.page / 2
        )}/99/${kk}`,
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
      url: `https://thepiratebay0.org/search/${qq}/${Math.floor(
        params.page / 2
      )}/99/${kk}`
    };
  }

  request(options, function(error, response, html) {
    let i = 0;
    // console.log(html);
    if (error) {
      return callback(error);
    }

    if (!error) {
      const $ = cheerio.load(html);
      $('#searchResult tr').each(function(i, e) {
        let magLink = '';
        const lowlim = (params.page % 2) * 60;
        const uplim = (params.page % 2 + 1) * 60 + 1; //reduce output from 30 to 15.
        $('td', e).each(function(a, b) {
          magsearch.attr.peers.unshift(' ');
          //title & mag
          if (a % 4 === 1 && a < uplim && a > lowlim) {
            const childs = $(b).children();
            let size = childs
              .eq(4)
              .text()
              .substr(26);
            size = size.slice(0, size.indexOf(','));
            magsearch.attr.size.unshift(size);
            magsearch.attr.title.unshift(
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
            magsearch.attr.seeders.unshift(' ' + $(b).text());
          }
          //leekers
          if (a % 4 === 3 && a < uplim && a > lowlim) {
            magsearch.attr.leechers.unshift(' ' + $(b).text());
          }
        });
      });
    }
    magsearch.attr.url = options.url;
    return callback(magsearch.attr);
  });
};
