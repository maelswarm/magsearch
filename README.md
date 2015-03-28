# magsearch #

Search for magnet links in terminal.


## Install ##
![tag alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)

```
npm install -g magsearch
```

## Flags ##
 
  Launch. Add an option -t flag to launch with SOCKS.

  ```
magsearch "blade runner"
  ```
  
  ![ScreenShot](https://raw.github.com/roecrew/magsearch/master/Screen Shot.png)
  
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

Some of torrenthounds trackers are invalid.

## License ##
MIT
