<h1 align="center">magsearch</h1>

<p align="center"><strong>A low-key magnet-link cli</strong></p>

## Install ##
![build alt](https://travis-ci.org/roecrew/magsearch.svg?branch=master)
![platform alt](https://img.shields.io/badge/platform-windows%20|%20linux%20|%20osx-blue.svg)


Use magsearch to browse, download, or stream magnet links.

```
npm install magsearch -g
```

Once you've selected a magnet link, you can stream it with peerflix.

```
npm install peerflix -g
```

## What's New ##

TPB and its onion site are now the only supported sites.

## Issues ##

Torrent Health is still broken due to dead links

## Usage ##
 
 Empty launch
   ```
  magsearch
  ```
  
  Searching blade runner through the pirate bay
  ```
  magsearch "blade runner"
  ```
  
  Searching blade runner through the pirate bay's .onion on port 9150 (default is 9050).
  ```
  magsearch "blade runner" -t -p 9150
  ```
  ___
  
  Green is seed count. Red is leech count. Magenta is peer count. Both TPB and BTDigg fetch live peer count. <br>
  Navigate with the arrow keys. <br>
  Search with either ThePirateBay, BTDigg, Extratorrent, or Demonoid. <br>
  Use Ctrl-B & Ctrl-N to flip search page.
  
  ![ScreenShot1](http://s23.postimg.org/l4zi60cuj/Screen_Shot_2015_04_03_at_19_02_29.png)
  
  ---
  
  Socks compatible. <br>
  Searching on TOR uses .onions. <br>
  
  ![ScreenShot2](http://s1.postimg.org/dwdjiwlrz/Screen_Shot_2015_04_03_at_18_57_15.png)
  
  ___
  
  Settings include blocklist, player, socks port/host, health, magprint, path, subtitles, and --remove preferences. <br>
  
  Custom path examples: <br>
  OSX/Unix '/Users/johnsmith/' <br>
  Windows 'C:\Movies\'
  
  Use the health setting to run a realtime seed and peer check. The results will update <br>
  a few seconds after the search query returns. <br>
  
  If installed globally, you can access settings.js with the following. <br>
  
  ```
  cd /usr/local/lib/node_modules/magsearch; (sudo) nano settings.js
  ```
  

## API ##

  TODO

## Notes ##

UI looks best in iTerm.

## License ##

MIT

