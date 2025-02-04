#!/usr/bin/env node

process.stdin.setEncoding('utf8');
const plat = process.platform;

const mgSrch = require('./index.js');
const settings = require('./settings.js');
const http = require('http');
const fs = require('fs');
const os = require('os');
const argv = require('minimist')(process.argv.slice(2), {});
const clivas = require('clivas');
const spawn = require('child_process').spawn;
let pf;
const keypress = require('keypress');
keypress(process.stdin);
const opensubtitles = require('opensubtitles-client');

let searchStr = '';
let lastSearched = '';
let playerrow = 1002;
let subrow = 996;
let watchrow = 1500;
let cursorcol = 6006;
let searchrow = 1500;
let keywordrow = 5000;
let searchArr = ['PIRATEBAY', 'KICKASS'];
let keywordArr = ['all', 'video', 'audio', 'applications', 'adult'];
let playerArr = [
  'none',
  '--vlc',
  '--airplay',
  '--mplayer',
  '--smplayer',
  '--mpchc',
  '--potplayer',
  '--mpv',
  '--omx',
  '--webplay',
  '--jack'
];
const subArr = [
  'none',
  'eng',
  'chi',
  'ger',
  'ita',
  'jpn',
  'kor',
  'pol',
  'por',
  'rus',
  'spa',
  'swe'
];

if (argv.h || argv.H || argv.help || argv.HELP) {
  clivas.line('{green:\n  Usage:\r}');
  clivas.line('{green:  Use the arrow keys to toggle and navigate.\r}');
  clivas.line('{green:  To search for a magnet, input text and hit enter.\r}');
  clivas.line(
    '{green:  For SOCKS, set your port and host. If you use TOR, .onion sites will be used (except with kickass).\r}'
  );
  clivas.line(
    '{green:  If you want to launch with TOR enabled, use "-t" flag and "-p" followed by the port number (probably 9050 or 9150).\r}'
  );
  clivas.line(
    "{green:  If you use a blocklist, then make sure it's in the current path!\r}"
  );
  clivas.line('\n');
  process.exit(0);
}

if (!argv.k) {
  argv.k = 'all';
}

if (!argv.s) {
  argv.s = 'tpb';
}

if (!argv.p) {
  argv.p = settings.port;
} else {
  settings.port = argv.p;
}

if (!argv._[0]) {
  argv._[0] = '';
}

const options = {
  query: argv._[0],
  page: 0,
  keyword: argv.k,
  socks: { port: argv.p, host: settings.host, enabled: false }
};

if (argv.t) {
  options.socks.enabled = true;
}

function getSubs(md, callback) {
  const title = mgSrch.attr.title[watchrow % md];
  opensubtitles.api.login().then(function(token) {
    opensubtitles.api
      .search(token, settings.subtitles, {
        query: title,
        tag: ''
      })
      .then(function(results) {
        if (results[0] !== undefined) {
          clivas.line('Found subs. One moment please.');

          const url = results[0].SubDownloadLink.split('.gz').join('.srt');
          console.log(url);
          const path = os.tmpdir() + 'sub.srt';

          function retrieve(url, path) {
            const temp = fs.createWriteStream(path);
            http.get(url, function(response) {
              response.pipe(temp);
              temp.on('finish', function() {
                clivas.line('Subtitles downloaded.');
                opensubtitles.api.logout(token);
                return callback(path);
              });
            });
          }
          retrieve(url, path);
        } else {
          clivas.line('No subs');
          opensubtitles.api.logout(token);
          return callback(null);
        }
      });
  });
}

function launchPF(callback) {
  let tc = 0;
  const finSpawn = function() {
    clearInterval(tcInterval);
    if (settings.path !== 'tmp') {
      list.push('--path=' + settings.path);
    }
    if (settings.player !== 'none') {
      list.push(settings.player);
    }
    if (plat === 'win32') {
      list.unshift('/c', 'peerflix');
      pf = spawn('cmd', list, { stdio: 'inherit' });
    } else {
      pf = spawn('peerflix', list, { stdio: 'inherit' });
    }
    clivas.line(list);
  };

  const tcInterval = setInterval(function() {
    if (tc === 2) {
      finSpawn();
    }
  }, 1250);

  clivas.line('Preparing...');

  let md = mgSrch.attr.mag.length;
  const blist = settings.blocklist;
  let list = [];

  list.push(mgSrch.attr.mag[watchrow % md]);
  if (settings.remove != false && settings.path === 'tmp') {
    list.push('--remove');
  }
  list.push('--all');

  if (blist === 'auto') {
    if (plat !== 'win32') {
      list.push('--blocklist=/usr/local/lib/node_modules/magsearch/btlev1');
    } else {
      list.push(
        '--blocklist=C:UsersAdministratorAppDataRoaming\npm\node_modulesmagsearch\btlev1'
      );
    }
    tc++;
  } else {
    if (blist !== undefined) {
      list.push('--blocklist=' + blist);
    }
    tc++;
  }
  if (settings.subtitles !== 'none') {
    getSubs(md, function(result) {
      if (result !== null) {
        list.push('--subtitles=' + result);
      }
      tc++;
    });
  } else {
    tc++;
  }
}

async function search() {
  if (options.query && argv.s) {
    if (argv.s === 'btd') {
      await mgSrch.btdigg(options, function(result) {
        draw();
        if (result === undefined) {
          return;
        }
        if (result.errno) {
          clivas.line('');
          clivas.line('');
          clivas.line(result);
          return;
        }
      });
    } else if (argv.s === 'tpb') {
      await mgSrch.pbay(options, function(result) {
        let cnt = 0;
        if (result === undefined) {
          return;
        }
        draw();
        if (result.errno) {
          clivas.line('');
          clivas.line('');
          clivas.line(result.errno);
          return;
        }
        if (result.title === undefined) {
          clivas.line('');
          clivas.line('');
          clivas.line(
            "Either there are no results, or the piratebay is down. Try using it's .onion."
          );
          return;
        }
        if (settings.health === true) {
          const len = result.title.length;
          for (let i = 0; i < len; i++) {
            //						mgSrch.gethealth(i, function(fin) { // temp disabled
            //							clivas.write(cnt)
            //							cnt++;
            //							if(cnt === len) {
            //								draw()
            //							}
            //						})
          }
        }
      });
    } else if (argv.s === 'kat') {
      await mgSrch.kat(options, function(result) {
        //var cnt = 0;
        if (result === undefined) {
          return;
        }
        draw();
        if (result.errno) {
          clivas.line('');
          clivas.line('');
          clivas.line(result.errno);
          return;
        }
        if (result.title === undefined) {
          clivas.line('');
          clivas.line('');
          clivas.line(
            'Either there are no results, or the kickass is down. Try a different search engine.'
          );
          return;
        }
      });
    } else if (argv.s === 'demon') {
      await mgSrch.demon(options, function(result) {
        //process.exit()
        let cnt = 0;
        draw();
        if (result === undefined) {
          return;
        }
        if (result.errno) {
          clivas.line('');
          clivas.line('');
          clivas.line(result.errno);
          return;
        }
        if (result.title === undefined) {
          clivas.line('');
          clivas.line('');
          clivas.line(
            "Either there are no results, or the demon is down. Try using it's .onion."
          );
          return;
        }
      });
    } else if (argv.s === 'extra') {
      await mgSrch.extra(options, function(result) {
        //process.exit()
        let cnt = 0;
        draw();
        if (result === undefined) {
          return;
        }
        if (result.errno) {
          clivas.line('');
          clivas.line('');
          clivas.line(result.errno);
          return;
        }
        if (result.title === undefined) {
          clivas.line('');
          clivas.line('');
          clivas.line(
            'Either there are no results, or the extratorrent is down.'
          );
          return;
        }
      });
    }
  } else {
    await draw();
  }
}
search();

function draw() {
  const result = mgSrch.attr;
  const searchEngine = searchArr[searchrow % 1];
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  clivas.clear();
  clivas.line(
    '{bold:┎──────────────────────────────────────────────────────────────────────────────────────────────────────────────────}'
  );
  if (cursorcol % 11 === 0) {
    clivas.write('{bold:┃}' + '{bold+red: ' + searchEngine + ' }');
    clivas.write('{bold:│}' + ' keyword ');
    clivas.write('│ watch ');
    clivas.write('│ socks │');
    clivas.line(' settings │');
  }
  if (cursorcol % 11 === 1) {
    clivas.write('{bold:┃ }' + searchEngine);
    clivas.write('{bold: │ ' + keywordArr[keywordrow % 5] + ' │}');
    clivas.write(' watch ');
    clivas.write('│ socks │');
    clivas.line(' settings │');
  } else if (cursorcol % 11 === 2) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword ' + '{bold:│}');
    clivas.write('{bold+yellow: WATCH }');
    clivas.write('{bold:│}' + ' socks │');
    clivas.line(' settings │');
  } else if (cursorcol % 11 === 3) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch ' + '{bold:│}');
    clivas.write(
      '{bold+magenta: SOCKS }' +
        '{bold:│ Port: ' +
        options.socks.port +
        ' │}' +
        ' Host: ' +
        options.socks.host +
        ' │' +
        ' Enabled: ' +
        Boolean(options.socks.enabled) +
        ' │'
    );
    clivas.line(' settings ' + '{bold:┃}');
  } else if (cursorcol % 11 === 4) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch ' + '{bold:│}');
    clivas.write(
      '{bold+magenta: SOCKS }' +
        '{bold:│}' +
        ' Port: ' +
        options.socks.port +
        ' ' +
        '{bold:│ Host: ' +
        options.socks.host +
        ' │}' +
        ' Enabled: ' +
        Boolean(options.socks.enabled) +
        ' │'
    );
    clivas.line(' settings ' + '{bold:┃}');
  } else if (cursorcol % 11 === 5) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch ' + '{bold:│}');
    clivas.write(
      '{bold+magenta: SOCKS }' +
        '{bold:│}' +
        ' Port: ' +
        options.socks.port +
        ' │' +
        ' Host: ' +
        options.socks.host +
        '{bold: │ Enabled: ' +
        Boolean(options.socks.enabled) +
        ' │}'
    );
    clivas.line(' settings ' + '{bold:┃}');
  } else if (cursorcol % 11 === 6) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch │');
    clivas.write(' socks ' + '{bold:│}');
    clivas.line(
      '{bold+blue: SETTINGS }' +
        '{bold:│ ' +
        settings.player +
        ' │}' +
        ' blocklist │' +
        ' mag-print │' +
        ' subtitles │' +
        ' path │'
    );
  } else if (cursorcol % 11 === 7) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch │');
    clivas.write(' socks ' + '{bold:│}');
    clivas.line(
      '{bold+blue: SETTINGS }' +
        '{bold:│}' +
        ' player ' +
        '{bold:│ ' +
        settings.blocklist +
        ' │}' +
        ' mag-print │' +
        ' subtitles │' +
        ' path │'
    );
  } else if (cursorcol % 11 === 8) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch │');
    clivas.write(' socks ' + '{bold:│}');
    clivas.line(
      '{bold+blue: SETTINGS }' +
        '{bold:│}' +
        ' player ' +
        '│ blocklist ' +
        '{bold:│ ' +
        settings.printmag +
        ' │}' +
        ' subtitles │' +
        ' path │'
    );
  } else if (cursorcol % 11 === 9) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch │');
    clivas.write(' socks ' + '{bold:│}');
    clivas.line(
      '{bold+blue: SETTINGS }' +
        '{bold:│}' +
        ' player ' +
        '│ blocklist ' +
        '│ mag-print ' +
        '{bold:│ ' +
        settings.subtitles +
        ' │}' +
        ' path │'
    );
  } else if (cursorcol % 11 === 10) {
    clivas.write('{bold:┃ }' + searchEngine + ' │');
    clivas.write(' keyword │');
    clivas.write(' watch │');
    clivas.write(' socks ' + '{bold:│}');
    clivas.line(
      '{bold+blue: SETTINGS }' +
        '{bold:│}' +
        ' player ' +
        '│ blocklist ' +
        '│ mag-print ' +
        '│ subtitles ' +
        '{bold:│ ' +
        settings.path +
        ' │}'
    );
  }
  clivas.line(
    '{bold:┠──────────────────────────────────────────────────────────────────────────────────────────────────────────────────}'
  );
  for (let i = result.title.length - 1; i >= 0; i--) {
    if (argv.s === 'tpb' || argv.s === 'kat') {
      if (watchrow % mgSrch.attr.mag.length == i && cursorcol % 11 === 2) {
        clivas.line(
          '{bold+cyan+blink:>}' +
            '{bold+cyan: ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}' +
            '{green:' +
            result.seeders[i] +
            '}' +
            '{red:' +
            result.leechers[i] +
            '}' +
            '{magenta:' +
            result.peers[i] +
            '}'
        );
      } else {
        clivas.line(
          '{bold:┃ ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}' +
            '{green:' +
            result.seeders[i] +
            '}' +
            '{red:' +
            result.leechers[i] +
            '}' +
            '{magenta:' +
            result.peers[i] +
            '}'
        );
      }
    } else if (argv.s === 'demon') {
      if (watchrow % 15 == i && cursorcol % 11 === 2) {
        clivas.line(
          '{bold+cyan+blink:>}' +
            '{bold+cyan: ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}' +
            '{green:' +
            result.seeders[i] +
            '}' +
            '{red:' +
            result.leechers[i] +
            '}'
        );
      } else {
        clivas.line(
          '{bold:┃ ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}' +
            '{green:' +
            result.seeders[i] +
            '}' +
            '{red:' +
            result.leechers[i] +
            '}'
        );
      }
    } else if (argv.s === 'extra') {
      if (watchrow % 10 == i && cursorcol % 11 === 2) {
        clivas.line(
          '{bold+cyan+blink:>}' +
            '{bold+cyan: ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}' +
            '{green:' +
            result.seeders[i] +
            '}' +
            '{red:' +
            result.leechers[i] +
            '}'
        );
      } else {
        clivas.line(
          '{bold:┃ ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}' +
            '{green:' +
            result.seeders[i] +
            '}' +
            '{red:' +
            result.leechers[i] +
            '}'
        );
      }
    } else {
      if (watchrow % mgSrch.attr.mag.length == i && cursorcol % 11 === 2) {
        clivas.line(
          '{bold+cyan+blink:>}' +
            '{bold+cyan: ' +
            result.title[i] +
            '}' +
            '{bold: ' +
            result.size[i] +
            '}'
        );
      } else {
        clivas.line(
          '{bold:┃ ' + result.title[i] + '}' + '{bold: ' + result.size[i] + '}'
        );
      }
    }
  }
  clivas.line(
    '{bold:┖──────────────────────────────────────────────────────────────────────────────────────────────────────────────────}'
  );
  if (result.url != '') {
    if (argv.s === 'kat' && options.socks.enabled) {
      clivas.line(' URL:' + result.url + " Note: kat's onion isn't supported.");
    } else {
      clivas.line(' URL:' + result.url);
    }
  }
  if (cursorcol % 11 !== 2) {
    if (cursorcol % 11 === 0 || cursorcol % 11 === 1) {
      if (searchStr === '') {
        clivas.write(' Type a title to search and hit enter:');
      } else {
        clivas.write(' Search:' + searchStr);
      }
    } else {
      clivas.write(' Input:' + searchStr);
    }
    return;
  }
  if (settings.printmag === true) {
    let md = 15;
    if (
      searchArr[searchrow % 1] === 'BTDIGG' ||
      searchArr[searchrow % 1] === 'EXTRATORRENT'
    ) {
      md = 10;
    }
    const tempmag = result.mag[watchrow % md];
    if (tempmag !== undefined) {
      clivas.write(tempmag);
    }
  }
}

const stdin = process.openStdin();
process.stdin.setRawMode(true);
stdin.on('keypress', function(chunk, key) {
  if (key == undefined) {
    searchStr += chunk;
    draw();
  } else if (key.ctrl && key.name == 'n') {
    options.page++;
    options.page = Math.abs(options.page);
    mgSrch.clearattr();
    search();
  } else if (key && key.ctrl && key.name == 'b') {
    options.page--;
    options.page = Math.abs(options.page);
    mgSrch.clearattr();
    search();
  } else if (key && key.ctrl && key.name == 'c') {
    if (pf != undefined) {
      pf.kill('SIGINT');
      draw();
      pf = undefined;
    } else {
      process.exit();
    }
  } else if (key.name == 'backspace') {
    searchStr = searchStr.slice(0, searchStr.length - 1);
    draw();
  } else if (key.name == 'up') {
    if (cursorcol % 11 === 0) {
      searchrow++;
    } else if (cursorcol % 11 === 1) {
      keywordrow++;
    } else if (cursorcol % 11 === 2) {
      watchrow++;
    } else if (cursorcol % 11 === 6) {
      resetInput();
      playerrow++;
      settings.player = playerArr[playerrow % 11];
    } else if (cursorcol % 11 === 9) {
      resetInput();
      subrow++;
      settings.subtitles = subArr[subrow % 12];
    }
    draw();
  } else if (key.name == 'down') {
    if (cursorcol % 11 === 0) {
      searchrow--;
    } else if (cursorcol % 11 === 1) {
      keywordrow--;
    } else if (cursorcol % 11 === 2) {
      watchrow--;
    } else if (cursorcol % 11 === 6) {
      resetInput();
      playerrow--;
      settings.player = playerArr[playerrow % 11];
    } else if (cursorcol % 11 === 9) {
      resetInput();
      subrow--;
      settings.subtitles = subArr[subrow % 12];
    }
    draw();
  } else if (key.name == 'right') {
    cursorcol++;
    draw();
  } else if (key.name == 'left') {
    cursorcol--;
    draw();
  } else if (key.name == 'return') {
    if (cursorcol % 11 === 0 || cursorcol % 11 === 1) {
      options.query = searchStr.trim();
      options.keyword = keywordArr[keywordrow % 5];
      mgSrch.clearattr();
      lastSearched = searchStr;
      if (searchArr[searchrow % 1] === 'PIRATEBAY') {
        argv.s = 'tpb';
      } else if (searchArr[searchrow % 1] === 'KICKASS') {
        argv.s = 'kat';
      } else if (searchArr[searchrow % 1] === 'DEMONOID') {
        argv.s = 'demon';
      } else {
        argv.s = 'btd';
      }
      watchrow = 1500;
      resetInput();
      search();
    } else if (cursorcol % 11 === 2) {
      launchPF();
    } else if (cursorcol % 11 === 3) {
      options.socks.port = searchStr;
      settings.post = options.socks.port;
      resetInput();
      draw();
    } else if (cursorcol % 11 === 4) {
      options.socks.host = searchStr;
      settings.host = options.socks.host;
      resetInput();
      draw();
    } else if (cursorcol % 11 === 5) {
      if (options.socks.enabled === false) {
        options.socks.enabled = true;
      } else {
        options.socks.enabled = false;
      }
      resetInput();
      draw();
    } else if (cursorcol % 11 === 6) {
      settings.player = playerArr[playerrow++ % 10];
      resetInput();
      draw();
    } else if (cursorcol % 11 === 7) {
      if (searchStr.trim() === '') {
        settings.blocklist = undefined;
      } else {
        settings.blocklist = searchStr;
      }
      resetInput();
      draw();
    } else if (cursorcol % 11 === 8) {
      if (settings.printmag === false) {
        settings.printmag = true;
      } else {
        settings.printmag = false;
      }
      resetInput();
      draw();
    } else if (cursorcol % 11 === 10) {
      if (searchStr.trim() === '') {
        settings.path = 'tmp';
      } else {
        settings.path = searchStr;
      }
      resetInput();
      draw();
    }
  } else {
    if (
      cursorcol % 11 === 0 ||
      cursorcol % 11 === 1 ||
      cursorcol % 11 === 3 ||
      cursorcol % 11 === 4 ||
      cursorcol % 11 === 5 ||
      cursorcol % 11 === 7 ||
      cursorcol % 11 === 10
    ) {
      searchStr += chunk;
      draw();
    }
  }
});

function resetInput() {
  searchStr = '';
}
