# magsearch #

Search for magnet links in terminal.


## Install ##
![tag alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)
```
npm install -g magsearch
```

## Flags ##

Use "-s" to choose the site to scrap.
Options are "tpb", "opb", "btd", and "thd" (default is "tpb").
  
Use "-p" to choose page (default is 1).

Use "-k" to narrow search. Only available with "tpb" and "opb".
Options are "video", "audio", "applications", and "adult" (default is "all").

Use "-t" to use SOCKS. Default port is "9050" and default hostname is "127.0.0.1" (TOR).
Only available with "tpb" and "btd".

In case your feeling lucky use "-L".

Use -h to show list of commands.

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
