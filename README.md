# magsearch #

Search for magnet links in terminal.


## Install ##
![tag alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)
```
npm install -g magsearch
```

## Flags ##

Use "-s" to choose the site to scrap.
Options are "tpb", "opb", "btd", and "thd".
  
Use "-p" to choose page. (default is 1)

Use "-k" to narrow search. This is only available with "tpb" and "opb".
Options are "video", "audio", "applications", and "adult". (default is "all")

Use "-t" to use SOCKS. Default port is 9050 and default hostname is 127.0.0.1. (TOR)
This is only available with "tpb" and "btd".

  ```
magsearch "schubert" -s tpb -k audio -t
  ```
  
  In case your feeling lucky use "-L"
  ```
magsearch "schubert" -L
  ```
  Use -h to show list of commands.

## Usage ##

You can import magsearch to retrieve magnet link metadata.
  ```js
  var mgSrch = require('magsearch');
  
  var sts = "String to search";
  var pageNum = 1;
  var keyword = "video";
  
  mgSrch.feelingLucky(sts, function(resultArr) {
	console.log(resultArr[0]); //print title
	console.log(resultArr[1]); // print magnet
  });
  
  mgSrch.btdigg(sts, pageNum, function(resultArr) {
    ...    
	resultArr[0][x] //title
	resultArr[1][x] //magnet
	resultArr[2][x] //description
	...
  });
  
  mgSrch.pbay(sts, pageNum, keyword, function(resultArr) {
    ...    
	resultArr[0][x] //title + description
	resultArr[1][x] //magnet
	resultArr[2][x] //seeders
	resultArr[3][x] //leechers
	...
  });
  
  mgSrch.oldpbay(sts, pageNum, keyword, function(resultArr) {
    ...    
	resultArr[0][x] //title + description
	resultArr[1][x] //magnet
	resultArr[2][x] //seeders
	resultArr[3][x] //leechers
	...
  });
  ```

## License ##
MIT
