# magsearch #

A low-key magnet-link cli


## Install ##
![build alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)
![platform alt](https://img.shields.io/badge/platform-windows%20|%20linux%20|%20osx-blue.svg)


Use magsearch to find magnet links.

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
  
  Green is seed count. Red is Leech count. Magenta is peer count (if health setting is on). <br>
  Navigate with the arrow keys. <br>
  Search with either ThePirateBay or BTDigg. <br>
  Use Ctrl-B & Ctrl-N to flip search page.
  
  ![ScreenShot1](http://s24.postimg.org/xnt0ci5fp/Screen_Shot_2015_03_28_at_23_24_45.png)
  
  ---
  
  Socks compatible. <br>
  Searching on TOR uses .onions. <br>
  
  ![ScreenShot2](http://s15.postimg.org/nktf3ct1n/Screen_Shot_2015_03_28_at_23_24_15.png)
  
  ___
  
  Settings include blocklist, player, socks port/host, health, magprint, and --remove preferences. <br>
  
  
  Use the health setting to run a realtime seed and peer check. The results will update <br>
  a few seconds after the search query returns. <br>
  
  If installed globally, you can access settings.js with the following. <br>
  
  ```
  cd /usr/local/lib/node_modules/magsearch; (sudo) nano settings.js
  ```
  

## API ##

  TODO

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

