# magsearch #

A low-key magnet-link cli


## Install ##
![tag alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)


Use magsearch to search for magnet links.

```
npm install -g magsearch
```

Once you've selected a magnet link, you can stream it with peerflix.

```
npm install -g peerflix
```

## Usage ##
 
  Add "-t" to launch with SOCKS enabled.

  ```
magsearch "blade runner"
  ```
  
  ___
  
  Navigate with the arrow keys. <br>
  Search with either ThePirateBay or BTDigg. <br>
  Use Ctrl-B & Ctrl-N to flip search page.
  
  ![ScreenShot1](http://s24.postimg.org/xnt0ci5fp/Screen_Shot_2015_03_28_at_23_24_45.png)
  
  ---
  
  Socks compatible. <br>
  Searching on TOR uses .onions. <br>
  
  ![ScreenShot2](http://s15.postimg.org/nktf3ct1n/Screen_Shot_2015_03_28_at_23_24_15.png)
  
  ___
  
  Settings include blocklist, player, port, host, and --remove preferences. <br>
  If installed globally, you can access settings.js with the following. <br>
  
  ```
  cd /usr/local/lib/node_modules/magsearch; (sudo) nano settings.js
  ```
  

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

Some of torrenthounds trackers are invalid. <br>
UI looks best in iTerm.

## License ##
The MIT License (MIT)

Copyright (c) 2015 Brandon Barber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

