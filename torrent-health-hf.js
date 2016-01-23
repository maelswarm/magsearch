var Q = require('q');
var readtorrent = require('read-torrent');
var async = require('async');
var Tracker = require('node-tracker');

module.exports = function (torrent) {
	var defer = Q.defer();
	var results = [];
	var health = {};

	readtorrent(torrent, function(err, torrentInfo) {
		if (err) {
			defer.reject(err);
		} else {
			async.eachLimit(torrentInfo.announce, 10, function(tr, cb) {
				// Complete tracker announce if not set
				if (tr.indexOf('/announce') === -1) {
					tr += '/announce';
				}

				var tracker = new Tracker(tr);
				setTimeout(function() {
					var resolved = null;
					// Timeout and continue with other sources
					var timeout = setTimeout(function() {
						if (!resolved) {
							tracker.close();
							return cb();
						}
					}, 3000);

					tracker.scrape([torrentInfo.infoHash], function(err, msg) {
						clearTimeout(timeout);
						if(err) {
							 return cb();
						}
						if(msg[torrentInfo.infoHash]) {
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
			}, function(err) {
				var totalSeeds = 0;
				var totalPeers = 0;
				for(var r in results) {
					totalSeeds += parseInt(results[r].seeds);
					totalPeers += parseInt(results[r].peers);
				}
				health.seeds = Math.round(totalSeeds/results.length) || 0;
				health.peers = Math.round(totalPeers/results.length) || 0;
				defer.resolve(health);
			});
		}
	});

	return defer.promise;
};
