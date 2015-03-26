# magsearch #

Search for magnet links in terminal.


## Install ##
![tag alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)
```
npm install -g magsearch
```

## Flags ##

-s \<site> : "tpb", "opb", "btd", and "thd" (default is "tpb")

-p \<page#> : 1,2,3...

-k \<keyword> : "video", "audio", "applications", and "adult" (default is "all") <br />
Only available with "tpb" and "opb"

-t \<port> \<host> : Default SOCKS port is "9050" with hostname "127.0.0.1" (TOR) <br />
Only available with "tpb" and "btd"


-L : In case your feeling lucky

-h : Show list of commands


  ```
magsearch "blade runner"
  ```

  ```
magsearch "schubert" -s btd -k audio -t
  ```
  
  ```
magsearch "schubert" -L
  ```

## Usage ##

  ```js
  var mgSrch = require('magsearch')
  
  var options = {
		query: "blade runner",
		page: 1,
		keyword: "video",
		socks: {port: undefined, host: undefined}
	}
  
  mgSrch.feelingLucky(options, function(result) {
	console.log(result.title[0]) //print title
	console.log(result.mag[0]) // print magnet
  })
  
  mgSrch.btdigg(options, function(result) {
    ...    
	result.title[x] //title + description
	result.mag[x] //magnet
	...
  })
  
  mgSrch.pbay(options, function(result) {
    ...    
	result.title[x] //title + description
	result.mag[x] //magnet
	result.seeders[x] //seeders
	result.leechers[x] //leechers
	result.peers[x] //peers
	...
  })
  
  mgSrch.oldpbay(options, function(resultArr) {
    ...    
	result.title[x] //title + description
	result.mag[x] //magnet
	result.seeders[x] //seeders
	result.leechers[x] //leechers
	...
  })
  
  mgSrch.torrenthound(options, function(resultArr) {
    ...    
	result.title[x] //title + description
	result.mag[x] //magnet
	result.seeders[x] //seeders
	result.leechers[x] //leechers
	...
  })
  ```

## Notes ##
Searching with ThePirateBay retrieves realtime torrent health.

Some of torrenthounds trackers are invalid.

## License ##
MIT
