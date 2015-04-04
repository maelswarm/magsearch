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
  
  Green is seed count. Red is leech count. Magenta is peer count (if health setting is on). <br>
  Navigate with the arrow keys. <br>
  Search with either ThePirateBay or BTDigg. <br>
  Use Ctrl-B & Ctrl-N to flip search page.
  
  ![ScreenShot1](http://s23.postimg.org/l4zi60cuj/Screen_Shot_2015_04_03_at_19_02_29.png)
  
  ---
  
  Socks compatible. <br>
  Searching on TOR uses .onions. <br>
  
  ![ScreenShot2](http://s1.postimg.org/dwdjiwlrz/Screen_Shot_2015_04_03_at_18_57_15.png)
  
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

MIT

