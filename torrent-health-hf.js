const Q = require('q');
const readtorrent = require('read-torrent');
const async = require('async');
const Tracker = require('node-tracker');

module.exports = function(torrent) {
  const defer = Q.defer();
  let results = [];
  let health = {};

  readtorrent(torrent, function(err, torrentInfo) {
    if (err) {
      defer.reject(err);
    } else {
      async.eachLimit(
        torrentInfo.announce,
        10,
        function(tr, cb) {
          // Complete tracker announce if not set
          if (tr.indexOf('/announce') === -1) {
            tr += '/announce';
          }

          const tracker = new Tracker(tr);
          setTimeout(function() {
            const resolved = null;
            // Timeout and continue with other sources
            const timeout = setTimeout(function() {
              if (!resolved) {
                tracker.close();
                return cb();
              }
            }, 3000);

            tracker.scrape([torrentInfo.infoHash], function(err, msg) {
              clearTimeout(timeout);
              if (err) {
                return cb();
              }
              if (msg[torrentInfo.infoHash]) {
                results.push({
                  seeds: msg[torrentInfo.infoHash].seeders,
                  peers: msg[torrentInfo.infoHash].leechers
                });
              }
              resolved = true;
              tracker.close();
              return cb();
            });
          }, 1000);
        },
        function(err) {
          const totalSeeds = 0;
          const totalPeers = 0;
          for (let r in results) {
            totalSeeds += parseInt(results[r].seeds);
            totalPeers += parseInt(results[r].peers);
          }
          health.seeds = Math.round(totalSeeds / results.length) || 0;
          health.peers = Math.round(totalPeers / results.length) || 0;
          defer.resolve(health);
        }
      );
    }
  });

  return defer.promise;
};
