# magsearch

Search The Pirate Bay from your terminal and stream results with [peerflix](https://github.com/mafintosh/peerflix).

[![CI](https://github.com/maelswarm/magsearch/actions/workflows/ci.yml/badge.svg)](https://github.com/maelswarm/magsearch/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/magsearch.svg)](https://www.npmjs.com/package/magsearch)

## Install

Requires Node.js 20 or newer.

```sh
npm install -g magsearch
npm install -g peerflix   # optional, for streaming
```

## Usage

```sh
magsearch                        # top 100
magsearch blade runner           # search
magsearch blade runner -c video  # search one category
magsearch ubuntu --json          # print results and exit
```

| Flag | |
| --- | --- |
| `-c, --category <name>` | `all`, `audio`, `video`, `apps`, `games` or `other` |
| `-t, --tor` | connect through Tor on `127.0.0.1:9050` |
| `--tor-port <port>` | connect through Tor on another port (Tor Browser uses `9150`) |
| `--socks` | connect through a SOCKS5 proxy on `127.0.0.1:1080` |
| `--socks-host <host>`, `--socks-port <port>` | set the SOCKS proxy address |
| `--api <url>` | API base URL (default `https://apibay.org`) |
| `-l, --list`, `--json` | print results as a table or as JSON, then exit |
| `-n, --limit <n>` | number of results to print |
| `--subtitles-key <key>` | save your OpenSubtitles API key |
| `--config` | print the settings file path |
| `-h, --help`, `-v, --version` | show help or the version |

Flags only last for one run, except `--subtitles-key`. To change something permanently, use the settings screen.

## Keys

| Search box | |
| --- | --- |
| type | edit the search |
| `enter` | search |
| `tab`, `shift-tab` | change category |
| `ctrl-w`, `ctrl-u` | delete a word, clear |
| `↓`, `esc` | go to results |

| Results | |
| --- | --- |
| `↑` `↓`, `j` `k` | move |
| `←` `→`, `pgup` `pgdn` | page |
| `home` `end`, `g` `G` | first / last result |
| `enter` | stream with peerflix |
| `o` | open in your torrent client |
| `y` | copy the magnet link |
| `m` | show the magnet link |
| `s` | change sort order |
| `r` | reload |
| `/` | edit the search |
| `,` | settings |
| `?` | help |
| `q`, `esc` | quit |

`ctrl-c` quits, or stops the current stream.

A colored dot marks VIP (green), trusted (magenta) and staff (blue) uploaders. After each search, magsearch gets fresh seeder and leecher counts from the trackers. It skips this over Tor or a SOCKS proxy, because the trackers are queried over UDP.

## Settings

Press `,` in the app. Settings are saved to `%APPDATA%\magsearch\settings.json` on Windows and `~/.config/magsearch/settings.json` elsewhere. Set `MAGSEARCH_CONFIG` to use another file.

- **Player:** `vlc` (default), `mpv`, `mplayer`, `smplayer`, `mpchc`, `potplayer`, `airplay`, `webplay`, `omx`, `jack`, or `none` to only download
- **Download folder:** leave empty to use a temp folder. **Delete after playback** removes the temp files afterwards.
- **Peer blocklist:** `auto` for the bundled list, a file path for your own, or empty for none
- **Live seeders/leechers** and **Show magnet link**
- **Subtitles** and your **OpenSubtitles API key, username and password**
- **Connect through:** direct, Tor or SOCKS proxy, plus the **Tor port** and **SOCKS proxy host and port**
- **Use the .onion site:** search The Pirate Bay's .onion site instead of apibay.org. This needs Tor.
- **Pirate Bay API:** the API base URL

## Tor and SOCKS

Tor must be running on your computer. The tor service listens on port 9050, and Tor Browser on 9150. A SOCKS proxy is any SOCKS5 server, for example an SSH tunnel made with `ssh -D 1080`. Use Tor or a SOCKS proxy, not both.

Only magsearch's own requests go through them, meaning searches and subtitle downloads. peerflix's torrent traffic does not.

## Subtitles

1. Get a free API key at <https://www.opensubtitles.com/consumers>.
2. Add it in settings, or run `magsearch --subtitles-key KEY`. You can also set `OPENSUBTITLES_API_KEY` instead.
3. Pick a subtitle language in settings.

Subtitles are downloaded when you start a stream. Adding your OpenSubtitles username and password raises the daily download limit. They're stored as plain text in the settings file.

## Scripting

```sh
peerflix "$(magsearch ubuntu --json | jq -r '.[0].magnet')" --vlc
```

```js
import { search, top } from 'magsearch';

const results = await search('blade runner', { category: 'video' });
// [{ id, name, infoHash, size, seeders, leechers, files, uploader,
//    status, added, category, imdb, magnet }]
```

To send these requests through Tor's local port or a SOCKS5 proxy, pass `proxy: { host, port }`.

## Notes

- Results come from `apibay.org`, the API behind thepiratebay.org. The adult section is left out.
- If magsearch can't find peerflix, set `MAGSEARCH_PEERFLIX` to the path of peerflix's `app.js`.

## Upgrading from 0.16

`-p` and `--host` are replaced by `--tor-port`, `--socks-host` and `--socks-port`. The old single proxy setting is now **Connect through**. If you used it, set it again.

## Development

```sh
npm install
npm start   # same as: node bin/magsearch.js
npm test
```

`index.js` is the library entry point. The app itself is `bin/magsearch.js`.

## License

MIT
