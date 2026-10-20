// Full-screen terminal UI. Everything is drawn into the alternate screen
// buffer in one write per frame, so the user's scrollback is left untouched.
import path from 'node:path';
import readline from 'node:readline';
import { CATEGORIES, TRACKERS, categoryLabel, searchUrl, torrentUrl } from '../index.js';
import { TOR_HOST, findTorrents, proxyFor } from './connection.js';
import {
  createStyle,
  formatAge,
  formatSize,
  padEnd,
  padStart,
  sanitize,
  shouldUseColor,
  stringWidth,
  truncate,
  truncateStart
} from './format.js';
import { scrape } from './health.js';
import { copyToClipboard, findPeerflix, openExternal, peerflixArgs, runPeerflix } from './launch.js';
import { CONNECTIONS, PLAYERS, configPath, saveSettings } from './settings.js';
import { SUBTITLE_LANGUAGES, fetchSubtitles } from './subtitles.js';

const CATEGORY_NAMES = Object.keys(CATEGORIES);
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SEARCH_ROW = 3; // 1-based screen row of the search box

const SORTS = [
  { label: 'seeders', compare: (a, b) => b.seeders - a.seeders || b.leechers - a.leechers },
  { label: 'size', compare: (a, b) => b.size - a.size },
  { label: 'newest', compare: (a, b) => b.added - a.added },
  { label: 'name', compare: (a, b) => a.name.localeCompare(b.name) }
];

const SETTINGS_ITEMS = [
  {
    key: 'player',
    label: 'Player',
    type: 'choice',
    choices: PLAYERS,
    help: 'Player peerflix opens once the stream is ready. "none" just downloads and serves it over HTTP.'
  },
  {
    key: 'path',
    label: 'Download folder',
    type: 'text',
    placeholder: 'temp folder',
    help: 'Where peerflix saves files. Leave empty to use a temp folder.'
  },
  {
    key: 'remove',
    label: 'Delete after playback',
    type: 'bool',
    help: 'Remove the downloaded files when peerflix exits (temp folder only).'
  },
  {
    key: 'blocklist',
    label: 'Peer blocklist',
    type: 'text',
    placeholder: 'off',
    show: (v) => (v === 'auto' ? 'bundled' : v),
    help: '"auto" uses the bundled list, empty turns it off, or enter the path to your own list.'
  },
  {
    key: 'health',
    label: 'Live seeders/leechers',
    type: 'bool',
    help: 'Ask the trackers for up-to-date counts after each search. Skipped while using Tor or a SOCKS proxy.'
  },
  {
    key: 'showMagnet',
    label: 'Show magnet link',
    type: 'bool',
    help: 'Show the selected magnet link at the bottom instead of its web page.'
  },
  {
    key: 'subtitles',
    label: 'Subtitles',
    type: 'choice',
    choices: SUBTITLE_LANGUAGES,
    help: 'Download subtitles in this language from OpenSubtitles.com before streaming. Needs an API key.'
  },
  {
    key: 'opensubtitlesApiKey',
    label: 'OpenSubtitles API key',
    type: 'text',
    secret: 'tail',
    placeholder: 'not set',
    help: 'Get a free key at https://www.opensubtitles.com/consumers'
  },
  {
    key: 'opensubtitlesUsername',
    label: 'OpenSubtitles username',
    type: 'text',
    placeholder: 'optional',
    help: 'Optional. Logging in raises your daily subtitle download limit.'
  },
  {
    key: 'opensubtitlesPassword',
    label: 'OpenSubtitles password',
    type: 'text',
    secret: 'full',
    placeholder: 'optional',
    help: 'Optional. Stored as plain text in your settings file.'
  },
  {
    key: 'connection',
    label: 'Connect through',
    type: 'choice',
    choices: CONNECTIONS,
    show: (v) => ({ direct: 'direct', tor: 'Tor', socks: 'SOCKS proxy' })[v],
    help: 'Send searches and subtitle requests directly, through Tor running on this computer, or through a SOCKS proxy.'
  },
  { key: 'torPort', label: 'Tor port', type: 'number', help: 'The tor service listens on 9050. Tor Browser uses 9150.' },
  {
    key: 'onion',
    label: 'Use the .onion site',
    type: 'bool',
    help: "Search The Pirate Bay's .onion site instead of apibay.org. Needs Tor."
  },
  { key: 'socksHost', label: 'SOCKS proxy host', type: 'text', help: 'Host of your SOCKS5 proxy.' },
  { key: 'socksPort', label: 'SOCKS proxy port', type: 'number', help: 'Most SOCKS proxies listen on 1080.' },
  {
    key: 'api',
    label: 'Pirate Bay API',
    type: 'text',
    help: 'Default https://apibay.org. Change it only if you use a mirror of the API.'
  }
];

const HELP = [
  ['Search box', null],
  ['type', 'edit the search'],
  ['enter', 'search (an empty search shows the top 100)'],
  ['tab / shift-tab', 'switch category'],
  ['↓ / esc', 'go to the results'],
  ['Results', null],
  ['↑ ↓ / j k', 'move'],
  ['← → / pgup pgdn', 'previous / next page'],
  ['home end / g G', 'first / last result'],
  ['enter', 'stream with peerflix'],
  ['o', 'open the magnet in your torrent client'],
  ['y', 'copy the magnet link'],
  ['m', 'show or hide the magnet link'],
  ['s', 'change sort order'],
  ['r', 'run the search again'],
  ['/', 'edit the search'],
  [',', 'settings'],
  ['q / esc', 'quit'],
  ['ctrl-c', 'quit from anywhere']
];

const STATUS_BADGES = {
  vip: 'green',
  trusted: 'magenta',
  helper: 'blue',
  moderator: 'blue',
  supermod: 'blue',
  admin: 'blue'
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function keyId(str, key) {
  if (key.ctrl) return `ctrl-${key.name}`;
  if (key.name === 'tab' && key.shift) return 'shift-tab';
  if (key.name && key.name.length > 1) return key.name === 'enter' ? 'return' : key.name;
  return str ?? key.name;
}

function printable(str, key) {
  if (!str || key.ctrl || key.meta) return '';
  return str.replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
}

export class App {
  constructor({ settings, overrides = {}, query = '', category = 'all', input = process.stdin, output = process.stdout }) {
    this.settings = settings; // saved to disk
    this.overrides = overrides; // command-line flags, this session only
    this.input = input;
    this.output = output;
    this.style = createStyle(shouldUseColor(output));

    this.query = query;
    this.category = category;
    this.searchedQuery = null;
    this.results = [];
    this.selected = 0;
    this.scroll = 0;
    this.pageSize = 10;
    this.sort = 0;

    this.focus = 'input'; // input | list | settings | help
    this.returnFocus = 'list';
    this.settingsIndex = 0;
    this.editing = null;

    this.status = null; // { kind: info | ok | error, text }
    this.busy = null;
    this.checking = false;
    this.liveText = '';
    this.frame = 0;
    this.searchSeq = 0;

    this.onKeypress = this.onKeypress.bind(this);
    this.onResize = () => this.render();
  }

  get config() {
    return { ...this.settings, ...this.overrides };
  }

  proxy() {
    return proxyFor(this.config);
  }

  find(query, category) {
    return findTorrents(query, { category, config: this.config });
  }

  get current() {
    return this.results[this.selected];
  }

  // ── lifecycle ──────────────────────────────────────────────────────────

  start() {
    readline.emitKeypressEvents(this.input);
    process.on('exit', () => this.detach());
    this.attach();
    const hasQuery = Boolean(this.query.trim());
    this.runSearch(this.query, { focusResults: hasQuery });
    return new Promise((resolve) => {
      this.exit = resolve;
    });
  }

  attach() {
    this.output.write('\x1b[?1049h\x1b[?25l');
    this.input.setRawMode(true);
    this.input.resume();
    this.input.on('keypress', this.onKeypress);
    this.output.on('resize', this.onResize);
    this.attached = true;
    this.render();
  }

  detach() {
    if (!this.attached) return;
    this.attached = false;
    this.input.off('keypress', this.onKeypress);
    this.output.off('resize', this.onResize);
    this.input.setRawMode(false);
    this.input.pause();
    this.output.write('\x1b[0m\x1b[?25h\x1b[?1049l');
  }

  quit() {
    this.setBusy(null);
    this.checking = false;
    this.updateSpinner();
    this.detach();
    this.exit?.();
  }

  // ── state changes ──────────────────────────────────────────────────────

  updateSpinner() {
    const spinning = Boolean(this.busy || this.checking);
    if (spinning && !this.spinner) {
      this.spinner = setInterval(() => {
        this.frame = (this.frame + 1) % SPINNER.length;
        this.render();
      }, 80);
    } else if (!spinning && this.spinner) {
      clearInterval(this.spinner);
      this.spinner = null;
    }
  }

  setBusy(text) {
    this.busy = text;
    this.updateSpinner();
    this.render();
  }

  setStatus(kind, text) {
    this.status = { kind, text };
    this.render();
  }

  async runSearch(query = this.query, { focusResults = true } = {}) {
    const seq = ++this.searchSeq;
    const q = query.trim();
    const category = this.category;
    this.query = query;
    this.status = null;
    this.checking = false;
    this.liveText = '';
    this.setBusy(q ? `Searching for “${q}”…` : 'Loading the top 100…');

    try {
      const results = await this.find(q, category);
      if (seq !== this.searchSeq) return;
      this.results = results.sort(SORTS[this.sort].compare);
      this.searchedQuery = q;
      this.selected = 0;
      this.scroll = 0;
      if (results.length && focusResults && this.focus === 'input') this.focus = 'list';
      if (!results.length) {
        const where = category === 'all' ? '' : ` in ${category}`;
        this.status = { kind: 'info', text: q ? `No results for “${q}”${where}.` : 'Nothing to show.' };
      }
      this.setBusy(null);
      if (results.length && this.config.health) this.checkHealth(seq);
    } catch (err) {
      if (seq !== this.searchSeq) return;
      this.setBusy(null);
      this.setStatus('error', err.message);
    }
  }

  async checkHealth(seq) {
    // Tracker scrapes are UDP, which can't go through Tor or a SOCKS proxy;
    // skipping them keeps the user's IP from leaking around it.
    if (this.proxy()) {
      this.liveText = `live counts off while using ${this.config.connection === 'tor' ? 'Tor' : 'a SOCKS proxy'}`;
      this.render();
      return;
    }
    const byHash = new Map(this.results.map((t) => [t.infoHash.toLowerCase(), t]));
    const apply = (stats) => {
      if (seq !== this.searchSeq) return;
      for (const [hash, s] of stats) {
        const torrent = byHash.get(hash);
        if (torrent && s.seeders + s.leechers > 0) {
          torrent.seeders = s.seeders;
          torrent.leechers = s.leechers;
        }
      }
      this.render();
    };

    this.checking = true;
    this.updateSpinner();
    const { stats, responded } = await scrape([...byHash.keys()], TRACKERS, { onProgress: apply });
    if (seq !== this.searchSeq) return;
    apply(stats);
    this.checking = false;
    this.updateSpinner();
    this.liveText = responded
      ? `live counts from ${responded} tracker${responded === 1 ? '' : 's'}`
      : 'trackers unreachable, showing TPB counts';
    if (SORTS[this.sort].label === 'seeders') this.resort();
    this.render();
  }

  resort() {
    const current = this.current;
    this.results.sort(SORTS[this.sort].compare);
    this.selected = Math.max(0, this.results.indexOf(current));
  }

  cycleSort() {
    this.sort = (this.sort + 1) % SORTS.length;
    this.resort();
    this.setStatus('info', `Sorted by ${SORTS[this.sort].label}.`);
  }

  cycleCategory(step) {
    const i = CATEGORY_NAMES.indexOf(this.category);
    this.category = CATEGORY_NAMES[(i + step + CATEGORY_NAMES.length) % CATEGORY_NAMES.length];
    const query = this.focus === 'input' ? this.query : (this.searchedQuery ?? this.query);
    this.runSearch(query, { focusResults: false });
  }

  select(index) {
    if (!this.results.length) return;
    this.selected = clamp(index, 0, this.results.length - 1);
    this.render();
  }

  setSetting(key, value) {
    this.settings[key] = value;
    delete this.overrides[key];
    try {
      saveSettings(this.settings);
    } catch (err) {
      this.setStatus('error', `Couldn't save settings: ${err.message}`);
    }
    this.render();
  }

  // ── actions on the selected torrent ────────────────────────────────────

  async stream() {
    const torrent = this.current;
    if (!torrent || this.busy) return;
    if (!findPeerflix()) {
      this.setStatus('error', 'peerflix is not installed. Install it with: npm install -g peerflix');
      return;
    }

    const config = this.config;
    let subtitles;
    let subtitleNote = '';
    if (config.subtitles !== 'none') {
      const apiKey = config.opensubtitlesApiKey || process.env.OPENSUBTITLES_API_KEY;
      if (!apiKey) {
        subtitleNote = 'Subtitles skipped: add your OpenSubtitles API key in settings (press , in magsearch).';
      } else {
        this.setBusy(`Looking for ${config.subtitles} subtitles…`);
        try {
          const found = await fetchSubtitles(torrent, {
            apiKey,
            username: config.opensubtitlesUsername,
            password: config.opensubtitlesPassword,
            language: config.subtitles,
            proxy: this.proxy()
          });
          subtitles = found?.path;
          subtitleNote = found
            ? `Subtitles: ${found.release || path.basename(found.path)}`
            : `No ${config.subtitles} subtitles found on OpenSubtitles.`;
        } catch (err) {
          subtitleNote = `Subtitles skipped: ${err.message}`;
        }
        this.setBusy(null);
      }
    }

    const s = this.style;
    this.streaming = true;
    this.detach();
    this.output.write(`\n${s.bold('Streaming')} ${sanitize(torrent.name)}\n`);
    if (subtitleNote) this.output.write(`${subtitleNote}\n`);
    this.output.write(`${s.dim('Press Ctrl-C to stop and go back to magsearch.')}\n\n`);

    // Ctrl-C reaches peerflix too; magsearch just waits for it to exit.
    const ignore = () => {};
    process.on('SIGINT', ignore);
    try {
      const { code, signal } = await runPeerflix(peerflixArgs(torrent.magnet, config, { subtitles }));
      // 130 = SIGINT on Unix, 3221225786 = STATUS_CONTROL_C_EXIT on Windows.
      const stopped = signal || code === 0 || code === 130 || code === 3221225786;
      this.status = stopped
        ? { kind: 'info', text: 'Stopped streaming.' }
        : { kind: 'error', text: `peerflix exited with code ${code}.` };
    } catch (err) {
      this.status = { kind: 'error', text: err.message };
    } finally {
      process.off('SIGINT', ignore);
      this.streaming = false;
      this.attach();
    }
  }

  async openInClient() {
    const torrent = this.current;
    if (!torrent) return;
    try {
      await openExternal(torrent.magnet);
      this.setStatus('ok', 'Sent to your torrent client.');
    } catch (err) {
      this.setStatus('error', `Couldn't open the magnet link: ${err.message}`);
    }
  }

  async copyMagnet() {
    const torrent = this.current;
    if (!torrent) return;
    if (await copyToClipboard(torrent.magnet)) {
      this.setStatus('ok', 'Magnet link copied.');
    } else {
      // No clipboard tool: ask the terminal to do it (OSC 52).
      this.output.write(`\x1b]52;c;${Buffer.from(torrent.magnet).toString('base64')}\x07`);
      this.setStatus('info', 'Sent the magnet link to the terminal clipboard (OSC 52).');
    }
  }

  // ── keyboard ───────────────────────────────────────────────────────────

  onKeypress(str, key) {
    key ??= {};
    if (key.ctrl && key.name === 'c') {
      this.quit();
      return;
    }
    const id = keyId(str, key);
    if (this.focus === 'input') this.inputKey(id, str, key);
    else if (this.focus === 'list') this.listKey(id);
    else if (this.focus === 'settings') this.settingsKey(id, str, key);
    else {
      this.focus = this.returnFocus;
      this.render();
    }
  }

  inputKey(id, str, key) {
    switch (id) {
      case 'return':
        this.runSearch(this.query);
        return;
      case 'backspace':
        this.query = Array.from(this.query).slice(0, -1).join('');
        break;
      case 'ctrl-u':
        this.query = '';
        break;
      case 'ctrl-w':
        this.query = this.query.replace(/\S+\s*$/, '');
        break;
      case 'tab':
        this.cycleCategory(1);
        return;
      case 'shift-tab':
        this.cycleCategory(-1);
        return;
      case 'down':
      case 'pagedown':
      case 'escape':
        this.focus = 'list';
        break;
      default: {
        const text = printable(str, key);
        if (!text) return;
        this.query += text;
      }
    }
    this.render();
  }

  listKey(id) {
    const page = Math.max(1, this.pageSize - 1);
    this.status = null;
    switch (id) {
      case 'up':
      case 'k':
        if (this.selected === 0 || !this.results.length) this.focus = 'input';
        else this.selected--;
        break;
      case 'down':
      case 'j':
        this.select(this.selected + 1);
        return;
      case 'pageup':
      case 'left':
      case 'ctrl-b':
        this.select(this.selected - page);
        return;
      case 'pagedown':
      case 'right':
      case 'ctrl-n':
        this.select(this.selected + page);
        return;
      case 'home':
      case 'g':
        this.select(0);
        return;
      case 'end':
      case 'G':
        this.select(this.results.length - 1);
        return;
      case 'return':
        this.stream();
        return;
      case 'o':
        this.openInClient();
        return;
      case 'y':
      case 'c':
        this.copyMagnet();
        return;
      case 'm':
        this.setSetting('showMagnet', !this.config.showMagnet);
        return;
      case 's':
        this.cycleSort();
        return;
      case 'r':
        this.runSearch(this.searchedQuery ?? this.query, { focusResults: false });
        return;
      case 'tab':
        this.cycleCategory(1);
        return;
      case 'shift-tab':
        this.cycleCategory(-1);
        return;
      case '/':
      case 'i':
        this.focus = 'input';
        break;
      case ',':
      case 'p':
        this.returnFocus = 'list';
        this.focus = 'settings';
        break;
      case '?':
        this.returnFocus = 'list';
        this.focus = 'help';
        break;
      case 'q':
      case 'escape':
        this.quit();
        return;
      default:
        return;
    }
    this.render();
  }

  settingsKey(id, str, key) {
    const item = SETTINGS_ITEMS[this.settingsIndex];
    if (this.editing) {
      if (id === 'return') this.commitEdit(item);
      else if (id === 'escape') this.editing = null;
      else if (id === 'backspace') this.editing.value = Array.from(this.editing.value).slice(0, -1).join('');
      else if (id === 'ctrl-u') this.editing.value = '';
      else this.editing.value += printable(str, key);
      this.render();
      return;
    }
    switch (id) {
      case 'up':
      case 'k':
        this.settingsIndex = clamp(this.settingsIndex - 1, 0, SETTINGS_ITEMS.length - 1);
        break;
      case 'down':
      case 'j':
        this.settingsIndex = clamp(this.settingsIndex + 1, 0, SETTINGS_ITEMS.length - 1);
        break;
      case 'left':
        this.changeSetting(item, -1);
        break;
      case 'right':
      case 'space':
        this.changeSetting(item, 1);
        break;
      case 'return':
        if (item.type === 'text' || item.type === 'number') {
          this.editing = { value: String(this.config[item.key] ?? '') };
        } else {
          this.changeSetting(item, 1);
        }
        break;
      case 'escape':
      case 'q':
      case ',':
        this.focus = this.returnFocus;
        break;
      default:
        return;
    }
    this.render();
  }

  changeSetting(item, step) {
    const value = this.config[item.key];
    if (item.type === 'bool') {
      this.setSetting(item.key, !value);
    } else if (item.type === 'choice') {
      const i = item.choices.indexOf(value);
      const n = item.choices.length;
      this.setSetting(item.key, item.choices[(i + step + n) % n]);
    }
  }

  commitEdit(item) {
    const value = this.editing.value.trim();
    this.editing = null;
    if (item.type === 'number') {
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        this.setStatus('error', `“${value}” isn't a valid port.`);
        return;
      }
      this.setSetting(item.key, port);
    } else {
      this.setSetting(item.key, value);
    }
  }

  // ── drawing ────────────────────────────────────────────────────────────

  render() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    setImmediate(() => {
      this.renderQueued = false;
      this.draw();
    });
  }

  draw() {
    if (!this.attached) return;
    const s = this.style;
    const cols = this.output.columns || 80;
    const rows = this.output.rows || 24;
    // Stay one column short of the edge so no terminal auto-wraps or scrolls.
    const width = cols - 1;

    if (cols < 40 || rows < 10) {
      this.output.write(`\x1b[?25l\x1b[H\x1b[J${truncate('Make the terminal a little bigger.', width)}`);
      return;
    }

    const search = this.searchLine(width);
    const lines = [this.headerLine(width), '', search.text, ''];
    const bodyHeight = rows - lines.length - 3;
    const body =
      this.focus === 'settings'
        ? this.settingsLines(width)
        : this.focus === 'help'
          ? this.helpLines(width)
          : this.resultLines(width, bodyHeight);
    // Settings rows start at index 2; scroll if the selected one would be cut off.
    const offset = this.focus === 'settings' ? Math.max(0, this.settingsIndex + 3 - bodyHeight) : 0;
    for (let i = 0; i < bodyHeight; i++) lines.push(body[i + offset] ?? '');
    lines.push(this.statusLine(width), this.infoLine(width), this.hintLine(width));

    let frame = '\x1b[?25l\x1b[H' + lines.map((l) => `${l}${s.reset}\x1b[K`).join('\r\n') + '\x1b[J';
    if (this.focus === 'input') frame += `\x1b[${SEARCH_ROW};${search.cursor}H\x1b[?25h`;
    this.output.write(frame);
  }

  headerLine(width) {
    const s = this.style;
    const title = s.bold(s.magenta(' magsearch '));
    const tabs = CATEGORY_NAMES.map((name) =>
      name === this.category ? s.inverse(` ${name} `) : s.dim(` ${name} `)
    ).join('');
    const { connection, onion, torPort, socksHost, socksPort } = this.config;
    const right =
      connection === 'tor'
        ? s.yellow(`● Tor ${TOR_HOST}:${torPort}${onion ? ' · .onion' : ''}`)
        : connection === 'socks'
          ? s.yellow(`● SOCKS ${socksHost}:${socksPort}`)
          : onion
            ? s.yellow('● .onion needs Tor')
            : '';
    let left = `${title} ${tabs}`;
    if (stringWidth(left) > width) left = `${title} ${s.inverse(` ${this.category} `)}`;
    const gap = width - stringWidth(left) - stringWidth(right);
    return gap >= 2 ? left + ' '.repeat(gap) + right : left;
  }

  searchLine(width) {
    const s = this.style;
    const active = this.focus === 'input';
    const label = ' Search › ';
    const prompt = active ? s.bold(s.cyan(label)) : s.dim(label);
    const available = width - stringWidth(label) - 1;
    const shown = truncateStart(this.query, available);
    const placeholder =
      !this.query && active ? s.dim(truncate('type a title and press enter', available)) : '';
    return {
      text: prompt + (active ? shown : s.dim(shown)) + placeholder,
      cursor: stringWidth(label) + stringWidth(shown) + 1
    };
  }

  columns(width) {
    const showType = width >= 96;
    const showAge = width >= 66;
    const col = { badge: 4, type: showType ? 14 : 0, size: 9, seeders: 6, leechers: 6, age: showAge ? 4 : 0 };
    const fixed =
      col.badge + (showType ? col.type + 2 : 0) + 2 + col.size + 1 + col.seeders + 1 + col.leechers + (showAge ? col.age + 1 : 0);
    col.name = Math.max(8, width - fixed);
    return col;
  }

  resultLines(width, height) {
    const s = this.style;
    if (!this.results.length) {
      if (this.busy || this.searchedQuery === null) return [];
      return ['', s.dim('   Try another search, or press tab to change the category.')];
    }

    const col = this.columns(width);
    const cells = (name, type, size, seeders, leechers, age) => {
      let line = name + '  ';
      if (col.type) line += type + '  ';
      line += size + ' ' + seeders + ' ' + leechers;
      if (col.age) line += ' ' + age;
      return line;
    };
    const lines = [
      s.dim(
        '    ' +
          cells(
            padEnd('Name', col.name),
            padEnd('Type', col.type),
            padStart('Size', col.size),
            padStart('SE', col.seeders),
            padStart('LE', col.leechers),
            padStart('Age', col.age)
          )
      )
    ];

    const visible = Math.max(1, height - 1);
    this.pageSize = visible;
    if (this.selected < this.scroll) this.scroll = this.selected;
    if (this.selected >= this.scroll + visible) this.scroll = this.selected - visible + 1;
    this.scroll = clamp(this.scroll, 0, Math.max(0, this.results.length - visible));

    const end = Math.min(this.results.length, this.scroll + visible);
    for (let i = this.scroll; i < end; i++) {
      const t = this.results[i];
      const selected = i === this.selected;
      const active = selected && this.focus === 'list';
      const badgeColor = STATUS_BADGES[t.status];
      const marker = selected ? (active ? s.cyan('›') : s.dim('›')) : ' ';
      const badge = badgeColor ? s[badgeColor]('●') : ' ';
      const name = padEnd(truncate(sanitize(t.name), col.name), col.name);
      const dead = t.seeders === 0;
      const row =
        ` ${marker}${badge} ` +
        cells(
          active ? s.bold(name) : name,
          s.dim(padEnd(truncate(categoryLabel(t.category, { short: true }), col.type), col.type)),
          padStart(formatSize(t.size), col.size),
          (dead ? s.gray : s.green)(padStart(String(t.seeders), col.seeders)),
          (dead ? s.gray : s.red)(padStart(String(t.leechers), col.leechers)),
          s.dim(padStart(formatAge(t.added), col.age))
        );
      lines.push(active ? s.highlight + row + ' '.repeat(Math.max(0, width - stringWidth(row))) : row);
    }
    return lines;
  }

  settingsLines(width) {
    const s = this.style;
    const labelWidth = 26;
    const lines = [` ${s.bold('Settings')}`, ''];
    SETTINGS_ITEMS.forEach((item, i) => {
      const selected = i === this.settingsIndex;
      const raw = this.config[item.key];
      let value;
      if (selected && this.editing) {
        value = this.editing.value + s.inverse(' ');
      } else if (item.type === 'bool') {
        value = raw ? s.green('on') : s.dim('off');
      } else if (raw === '' || raw === undefined) {
        value = s.dim(item.placeholder ?? '');
      } else if (item.secret === 'full') {
        value = '••••••••';
      } else if (item.secret === 'tail') {
        value = '••••••••' + String(raw).slice(-4);
      } else {
        value = truncate(String(item.show ? item.show(raw) : raw), width - labelWidth - 8);
        if (selected && item.type === 'choice') value = `‹ ${value} ›`;
      }
      if (Object.hasOwn(this.overrides, item.key)) value += s.yellow('  (from command line)');
      const marker = selected ? s.cyan('›') : ' ';
      const label = padEnd(item.label, labelWidth);
      lines.push(` ${marker} ${selected ? s.bold(label) : label}${value}`);
    });
    lines.push('', s.dim(` Saved to ${truncate(configPath(), width - 10)}`));
    return lines;
  }

  helpLines(width) {
    const s = this.style;
    const lines = [` ${s.bold('Keys')}`];
    for (const [keys, text] of HELP) {
      if (text === null) lines.push(`  ${s.underline(keys)}`);
      else lines.push(`   ${s.cyan(padEnd(keys, 18))}${truncate(text, width - 22)}`);
    }
    lines.push(
      `  ${s.green('●')} VIP uploader  ${s.magenta('●')} trusted uploader  ${s.blue('●')} staff`
    );
    return lines;
  }

  statusLine(width) {
    const s = this.style;
    let right = '';
    if (this.results.length && this.focus !== 'settings' && this.focus !== 'help') {
      const end = Math.min(this.results.length, this.scroll + this.pageSize);
      right = s.dim(`${this.scroll + 1}–${end} of ${this.results.length}`);
    }
    const room = width - stringWidth(right) - 3;

    let left;
    if (this.busy) {
      left = `${s.cyan(SPINNER[this.frame])} ${truncate(this.busy, room - 2)}`;
    } else if (this.status) {
      const { kind, text } = this.status;
      const icon = kind === 'error' ? '✗ ' : kind === 'ok' ? '✓ ' : '';
      const color = kind === 'error' ? s.red : kind === 'ok' ? s.green : (x) => x;
      left = color(truncate(icon + text, room));
    } else if (this.searchedQuery !== null) {
      const count = this.results.length;
      const what = this.searchedQuery
        ? `${count} result${count === 1 ? '' : 's'} for “${this.searchedQuery}”`
        : `Top ${count}`;
      let summary = `${what} · ${this.category} · by ${SORTS[this.sort].label}`;
      if (this.checking) summary += ' · checking trackers';
      else if (this.liveText) summary += ` · ${this.liveText}`;
      left = truncate(summary, room - (this.checking ? 2 : 0));
      if (this.checking) left += ` ${s.cyan(SPINNER[this.frame])}`;
      left = s.dim(left);
    } else {
      left = '';
    }
    const gap = width - stringWidth(left) - stringWidth(right) - 1;
    return ' ' + left + (right && gap > 0 ? ' '.repeat(gap) + right : '');
  }

  infoLine(width) {
    const s = this.style;
    if (this.focus === 'settings') {
      return s.dim(' ' + truncate(SETTINGS_ITEMS[this.settingsIndex].help ?? '', width - 1));
    }
    // Over Tor, link to the site's .onion address.
    const onion = this.config.connection === 'tor';
    const torrent = this.current;
    if (!torrent) {
      return this.searchedQuery === null
        ? ''
        : s.dim(' ' + truncate(searchUrl(this.searchedQuery, this.category, { onion }), width - 1));
    }
    if (this.config.showMagnet) return s.dim(' ' + truncate(torrent.magnet, width - 1));
    const details = [
      categoryLabel(torrent.category),
      torrent.files ? `${torrent.files} file${torrent.files === 1 ? '' : 's'}` : '',
      torrent.uploader ? `by ${sanitize(torrent.uploader)}` : '',
      torrent.url || torrentUrl(torrent.id, { onion })
    ].filter(Boolean);
    return s.dim(' ' + truncate(details.join(' · '), width - 1));
  }

  hintLine(width) {
    const s = this.style;
    let hints;
    if (this.focus === 'input') {
      hints = [['enter', 'search'], ['tab', 'category'], ['esc', 'results & menu'], ['ctrl-c', 'quit']];
    } else if (this.focus === 'list') {
      hints = [
        ['enter', 'stream'], ['o', 'open'], ['y', 'copy'], ['s', 'sort'], ['tab', 'category'],
        ['/', 'search'], [',', 'settings'], ['?', 'help'], ['q', 'quit']
      ];
    } else if (this.focus === 'settings' && this.editing) {
      hints = [['enter', 'save'], ['esc', 'cancel'], ['ctrl-u', 'clear']];
    } else if (this.focus === 'settings') {
      hints = [['↑↓', 'choose'], ['←→', 'change'], ['enter', 'edit'], ['esc', 'back']];
    } else {
      hints = [['any key', 'back']];
    }
    let line = '';
    for (const [key, label] of hints) {
      const part = `${line ? '  ' : ' '}${s.bold(key)} ${s.dim(label)}`;
      if (stringWidth(line + part) > width) break;
      line += part;
    }
    return line;
  }
}
