var request = require('request');
var cheerio = require('cheerio');

exports.feelingLucky = function(s, callback) {
	var ss="";
	var arr = [];
	for(var tmp=0; tmp<s.length; tmp++) {
		if(s.charAt(tmp) === ' ') {
			ss+='%20';
		}
		else {
			ss+=s.charAt(tmp);
		}
	}
	var url = 'http://btdigg.org/search?q='+ss+'&p=0&order=0';
	request(url, function(error, response, html){
		if(!error){
			var i=0;
			var $ = cheerio.load(html);
			arr.push($('.torrent_name_tbl').first().text());
			arr.push($('.ttth').first().find('a').filter("[href]").attr('href'));
			return callback(arr);
		}
	});
};

exports.pbay = function(q, p, callback) {
	var qq="";
	for(var tmp=0; tmp<q.length; tmp++) {
		if(q.charAt(tmp) === ' ') {
			qq+='%20';
		}
		else {
			qq+=q.charAt(tmp);
		}
	}
	var url = 'https://thepiratebay.se/search/'+qq+'/'+p+'/7/0';
	console.log('\n');
	
	request(url, function(error, response, html){
		var title = [];
		var seeders = [];
		var leakers = [];
		var mag = [];
		if(!error){
			var $ = cheerio.load(html);
			$('#searchResult').filter(function(){
				var tr = $(this).children('tr');
				$('td', tr).each(function(a, b) {
					//title
					if(a%4===1) {
						title.push($(b).text());
					}
					//mag
					if(a%4===1) {
						//console.log(a + ": " + $(b));
						mag.push($('a', this).eq(1).filter("[href]").attr('href'));
					}
					//seeders
					if(a%4===2) {
						seeders.push("Seeders: " + $(b).text());
					}
					//leekers
					if(a%4===3) {
						leakers.push("Leakers: " + $(b).text());
					}
				});
			});
		}
		console.log('\n');
		console.log('---------------------------------------------------------------');
		for(var a=29; a>=0; a--) {
			console.log(title[a]);
			console.log(seeders[a]);
			console.log(leakers[a]);
			console.log(mag[a]);
			console.log('\n');
			console.log('---------------------------------------------------------------');
		}
	});
};

exports.btdigg = function(q, p, callback) {
	var qq="";
	for(var tmp=0; tmp<q.length; tmp++) {
		if(q.charAt(tmp) === ' ') {
			qq+='%20';
		}
		else {
			qq+=q.charAt(tmp);
		}
	}
	var url = 'http://btdigg.org/search?q='+qq+'&p='+p+'&order=0';
	console.log('\n');
	request(url, function(error, response, html){
		var title = [];
		var dsc = [];
		var specs = [];
		var mag = [];
		if(!error){
			var $ = cheerio.load(html);
			var i=0;
			$('.torrent_name_tbl').filter(function(){
				if(i%2===0) {
					title.push($(this).text());
				}
				else {
					var tr = $(this).children('tr').first();
					var attr="";
					$('td', tr).each(function(a, b) {
						if(a>1&&8>a) {
							attr += $('.attr_name', b).text() + $('.attr_val', b).text();
							attr += " ";
						}
					});
					dsc.push(attr);
				}
				i++;
			});
			i=0;
			$('.ttth').filter(function(){
				if(i%2===0) {
					mag.push($('a', this).filter("[href]").attr('href'));
				}
				i++;
			});
		}
		console.log('\n');
		for(var a=0; a<10; a++) {
			console.log('---------------------------------------------------------------');
			console.log(title[a]);
			console.log(dsc[a]);
			console.log(mag[a]);
			console.log('---------------------------------------------------------------');
			console.log('\n');
		}
	});
};
