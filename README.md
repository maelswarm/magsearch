<h1 align="center">magsearch</h1>

<p align="center"><strong>Search The Pirate Bay from your terminal and stream magnet links with peerflix.</strong></p>

<p align="center">
  <a href="https://github.com/maelswarm/magsearch/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/maelswarm/magsearch/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/magsearch"><img alt="npm" src="https://img.shields.io/npm/v/magsearch.svg"></a>
  <img alt="platforms" src="https://img.shields.io/badge/platform-windows%20%7C%20linux%20%7C%20macos-blue.svg">
</p>

```
 magsearch   all  audio  video  apps  games  other

 Search › blade runner

    Name                                                      Type                 Size     SE     LE  Age
 ›● Blade Runner (1982) Final Cut 1080p BluRay.x264 SUJAIDR   HD Movies        2.07 GiB    574     24  10y
  ● Blade.Runner.2049.2017.1080p.BluRay.H264.AAC              HD Movies        3.14 GiB    569     99   7y
  ● Blade Runner 2049 (2017) [2160p] [BluRay] [5.1]           UHD/4k Movies    7.76 GiB    288     46   3y
  ● Blade.Runner.1982.1080p.BluRay.x264 [YTS.AM] [88]         HD Movies        1.91 GiB    283     43   2y
  ● Blade.Runner.2049.2017.PROPER.2160p.US.BluRay.REMUX.HEV…  UHD/4k Movies    78.0 GiB    203     70   3y

 100 results for “blade runner” · video · by seeders · live counts from 6 trackers          1–5 of 100
 Video > HD Movies · 3 files · by Supernova · https://thepiratebay.org/description.php?id=…
 enter stream  o open  y copy  s sort  tab category  / search  , settings  ? help  q quit
```

## Install

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install -g magsearch
```

To stream straight to a video player, also install [peerflix](https://github.com/mafintosh/peerflix):

```sh
npm install -g peerflix
```

Without peerflix you can still press <kbd>o</kbd> to hand a magnet link to your own torrent client, or <kbd>y</kbd> to copy it.

If magsearch can't find your peerflix install, set `MAGSEARCH_PEERFLIX` to the path of peerflix's `app.js`.

## Usage

```sh
magsearch                       # start with the top 100
magsearch blade runner          # search right away
magsearch blade runner -c video # only video
magsearch "blade runner" -t     # through Tor (SOCKS5 on 127.0.0.1:9050)
magsearch "blade runner" -t -p 9150  # through Tor Browser's proxy
```

`-t` sends requests to `apibay.org` through the proxy. To search The Pirate Bay's `.onion` site instead, turn on **Use the .onion site** in settings.

| Option | |
| --- | --- |
| `-c, --category <name>` | `all`, `audio`, `video`, `apps`, `games` or `other` |
| `-t, --tor` | send requests through a SOCKS5 proxy such as Tor |
| `-p, --port <port>` | proxy port (default `9050`; Tor Browser uses `9150`) |
| `--host <host>` | proxy host (default `127.0.0.1`) |
| `--api <url>` | Pirate Bay API (default `https://apibay.org`) |
| `-l, --list` | print results as a table and exit |
| `--json` | print results as JSON and exit |
| `-n, --limit <n>` | how many results to print (default 20 for `--list`, all for `--json`) |
| `--subtitles-key <key>` | save your OpenSubtitles.com API key |
| `--config` | print where settings are saved |
| `-h, --help` | show help |
| `-v, --version` | show the version |

Flags only apply to the current run, except `--subtitles-key`, which saves the key. Use the settings screen to change things permanently.

### Keys

| Search box | |
| --- | --- |
| type | edit the search |
| <kbd>enter</kbd> | search (an empty search shows the top 100) |
| <kbd>tab</kbd> / <kbd>shift-tab</kbd> | switch category |
| <kbd>ctrl-w</kbd> / <kbd>ctrl-u</kbd> | delete a word / clear the search |
| <kbd>↓</kbd> / <kbd>esc</kbd> | go to the results |

| Results | |
| --- | --- |
| <kbd>↑</kbd> <kbd>↓</kbd> or <kbd>j</kbd> <kbd>k</kbd> | move |
| <kbd>←</kbd> <kbd>→</kbd> or <kbd>pgup</kbd> <kbd>pgdn</kbd> | previous / next page |
| <kbd>home</kbd> <kbd>end</kbd> or <kbd>g</kbd> <kbd>G</kbd> | first / last result |
| <kbd>enter</kbd> | stream with peerflix |
| <kbd>o</kbd> | open the magnet in your torrent client |
| <kbd>y</kbd> | copy the magnet link |
| <kbd>m</kbd> | show / hide the magnet link |
| <kbd>s</kbd> | sort by seeders, size, newest or name |
| <kbd>r</kbd> | run the search again |
| <kbd>/</kbd> | edit the search |
| <kbd>,</kbd> | settings |
| <kbd>?</kbd> | all keys |
| <kbd>q</kbd> / <kbd>esc</kbd> | quit |

<kbd>ctrl-c</kbd> quits from anywhere. While a stream is playing, it stops peerflix and brings you back to your results instead.

A dot before a name marks the uploader: green for VIP, magenta for trusted, blue for site staff.

**SE** and **LE** are seeders and leechers. After each search magsearch asks the trackers for live counts. The Pirate Bay's own numbers can be days old. The live check uses UDP, which can't go through a SOCKS proxy, so it's turned off while you use a proxy or the `.onion` site.

## Settings

Press <kbd>,</kbd> in the app. Changes are saved straight away to:

- Windows: `%APPDATA%\magsearch\settings.json`
- macOS / Linux: `~/.config/magsearch/settings.json` (or `$XDG_CONFIG_HOME`)

Set `MAGSEARCH_CONFIG` to use a different file.

| Setting | Default | |
| --- | --- | --- |
| Player | `vlc` | `vlc`, `mpv`, `mplayer`, `smplayer`, `mpchc`, `potplayer`, `airplay`, `webplay`, `omx`, `jack`, or `none` to just download |
| Download folder | temp folder | where peerflix saves files |
| Delete after playback | on | remove temp downloads when peerflix exits |
| Peer blocklist | bundled | `auto` uses the bundled `btlev1` list; clear it to turn it off, or enter the path to your own |
| Live seeders/leechers | on | ask trackers for current counts |
| Show magnet link | off | show the magnet instead of the torrent's web page |
| Subtitles | `none` | language to fetch from OpenSubtitles.com |
| OpenSubtitles API key / username / password | | see below |
| Use SOCKS proxy (Tor), host, port | off, `127.0.0.1`, `9050` | send all requests through a SOCKS5 proxy |
| Use the .onion site | off | search The Pirate Bay's `.onion` site through Tor, using the proxy host and port above. All other requests go through the proxy too. |
| Pirate Bay API | `https://apibay.org` | change only if you use a mirror |

### Subtitles

magsearch can download subtitles from [OpenSubtitles.com](https://www.opensubtitles.com) when you start a stream, and pass them to peerflix.

1. Create a free account, then create an API consumer at <https://www.opensubtitles.com/consumers> to get an API key.
2. Add the key in the settings screen, or run `magsearch --subtitles-key YOUR_KEY`. You can also set the `OPENSUBTITLES_API_KEY` environment variable.
3. Pick a subtitle language in settings.

With only an API key, OpenSubtitles allows a few downloads per day. Add your OpenSubtitles username and password in settings to get your account's full limit. They're stored as plain text in the settings file. On macOS and Linux that file is created readable only by you.

## Scripting

`--json` prints every result with its magnet link:

```sh
magsearch ubuntu --json | jq -r '.[0].magnet'
peerflix "$(magsearch ubuntu --json | jq -r '.[0].magnet')" --vlc
```

When the output isn't a terminal, magsearch prints a plain table automatically.

magsearch also works as a library:

```js
import { search, top, magnetLink, searchUrl } from 'magsearch';

const results = await search('blade runner', { category: 'video' });
// [{ id, name, infoHash, size, seeders, leechers, files, uploader, status,
//    added, category, imdb, magnet }, …]

const popular = await top('audio');
const viaTor = await search('ubuntu', { proxy: { host: '127.0.0.1', port: 9050 } });
```

## How it works

[thepiratebay.org](https://thepiratebay.org) is a static page that loads its data from a JSON API at `apibay.org`. magsearch queries that API directly and builds magnet links with the same trackers the site uses. Torrent links point to `thepiratebay.org`, or to the site's `.onion` address while a proxy is on.

With **Use the .onion site** turned on, magsearch instead searches the `.onion` site through Tor, as earlier versions did, by reading its results pages.

The Pirate Bay's adult section is left out of all results.

## What's new in 0.16

- Rewritten for current Node.js, with one small dependency (`socks-proxy-agent`).
- Uses The Pirate Bay's current API (`apibay.org`) and links to `thepiratebay.org`. The `thepiratebay0.org` proxy is no longer used.
- New full-screen interface: categories as tabs, sorting, a help screen, and a settings screen that saves your changes.
- Settings are stored in your user config folder, so you no longer edit `settings.js` inside the install with sudo.
- Live seeder/leecher counts from the trackers again.
- Subtitles now use the OpenSubtitles.com REST API with your own API key. The old XML-RPC API has been shut down.
- Open magnets in your own torrent client, or copy them.
- The porn category is gone, and adult torrents are left out of all results.
- The `.onion` site is now an on/off setting. `-t` on its own uses `apibay.org` through Tor.
- `settings.js` and the `-s` (search engine) flag are gone. `-k` still works as another name for `-c`.
- `--list` and `--json` for scripts, and a promise-based library API.
- Fixes for Windows: the bundled blocklist path, and magnet links being cut off at `&` when launching peerflix.

## Running from source

```sh
npm install
npm start                 # or: node bin/magsearch.js [query] [options]
npm test
```

The app starts from `bin/magsearch.js`. `index.js` is the library entry point, so running it directly does nothing.

## License

MIT
