# magsearch #

A low-key magnet-link cli


## Install ##
![tag alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)

```
npm install -g magsearch
```
```
npm install -g peerflix
```

## Usage ##
 
  Add "-t" to launch with SOCKS.

  ```
magsearch "blade runner"
  ```
  
  ___
  
  Navigate with the arrow keys. <br>
  Search with either ThePirateBay or BTDigg. <br>
  Use Ctrl-B & Ctrl-N to flip search page.
  
  ![ScreenShot1](http://s8.postimg.org/84ha2mshh/Screen_Shot_2015_03_28_at_22_13_51.png)
  
  Socks compatible. <br>
  Searching on TOR uses .onions. <br>
  Settings allow for saving blocklist and player preferences.
  
  ![ScreenShot2](http://s8.postimg.org/d13adam5x/Screen_Shot_2015_03_28_at_22_22_54.png)
  
  ___
  

## API ##

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
	result.title[x] //title
	result.mag[x] //magnet
	result.seeders[x] //seeders
	result.leechers[x] //leechers
	...
  })
  
  mgSrch.oldpbay(options, function(resultArr) {
    ...    
	result.title[x] //title
	result.mag[x] //magnet
	result.seeders[x] //seeders
	result.leechers[x] //leechers
	...
  })
  
  mgSrch.torrenthound(options, function(resultArr) {
    ...    
	result.title[x] //title
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
