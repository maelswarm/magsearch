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

-k \<keyword> : "video", "audio", "applications", and "adult" (default is "all")

-t \<port> \<host> : Default SOCKS port is "9050" with hostname "127.0.0.1" (TOR)

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

You can import magsearch to retrieve magnet link metadata.
  ```js
  var mgSrch = require('magsearch')
  
  var sts = "String to search"
  var pageNum = 1
  var keyword = "video"
  var socks = 1
  var sArr = [9150, 127.0.0.1]
  
  mgSrch.feelingLucky(sts, function(resultArr) {
	console.log(resultArr[0]) //print title
	console.log(resultArr[1]) // print magnet
  })
  
  mgSrch.btdigg(sts, pageNum, socks, sArr, function(resultArr) {
    ...    
	resultArr[0][x] //title
	resultArr[1][x] //magnet
	resultArr[2][x] //description
	...
  })
  
  mgSrch.pbay(sts, pageNum, keyword, socks, sArr, function(resultArr) {
    ...    
	resultArr[0][x] //title + description
	resultArr[1][x] //magnet
	resultArr[2][x] //seeders
	resultArr[3][x] //leechers
	...
  })
  
  mgSrch.oldpbay(sts, pageNum, keyword, function(resultArr) {
    ...    
	resultArr[0][x] //title + description
	resultArr[1][x] //magnet
	resultArr[2][x] //seeders
	resultArr[3][x] //leechers
	...
  })
  ```

## Notes ##
Searching with ThePirateBay retrieves realtime torrent health.

Some of torrenthounds trackers are invalid.

## License ##
MIT
