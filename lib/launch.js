// Launching things outside magsearch: peerflix, the system torrent client and
// the clipboard.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const BUNDLED_BLOCKLIST = path.join(PACKAGE_ROOT, 'btlev1');

export function blocklistPath(setting) {
  if (!setting || setting === 'off' || setting === 'none') return null;
  if (setting === 'auto') return fs.existsSync(BUNDLED_BLOCKLIST) ? BUNDLED_BLOCKLIST : null;
  return setting;
}

export function peerflixArgs(magnet, settings, { subtitles } = {}) {
  const args = [magnet];
  if (settings.player && settings.player !== 'none') args.push(`--${settings.player}`);
  if (settings.path) args.push(`--path=${settings.path}`);
  else if (settings.remove) args.push('--remove');
  const blocklist = blocklistPath(settings.blocklist);
  if (blocklist) args.push(`--blocklist=${blocklist}`);
  if (subtitles) args.push(`--subtitles=${subtitles}`);
  return args;
}

function globalModuleDirs() {
  const dirs = [];
  const prefix = process.env.npm_config_prefix;
  if (process.platform === 'win32') {
    if (prefix) dirs.push(path.join(prefix, 'node_modules'));
    if (process.env.APPDATA) dirs.push(path.join(process.env.APPDATA, 'npm', 'node_modules'));
    dirs.push(path.join(path.dirname(process.execPath), 'node_modules'));
  } else {
    if (prefix) dirs.push(path.join(prefix, 'lib', 'node_modules'));
    dirs.push(path.join(path.dirname(path.dirname(process.execPath)), 'lib', 'node_modules'));
  }
  return dirs;
}

function onPath(command) {
  const exts =
    process.platform === 'win32'
      ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';')
      : [''];
  return (process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean)
    .some((dir) => exts.some((ext) => fs.existsSync(path.join(dir, command + ext))));
}

// Prefer running peerflix's own script with this Node binary: it avoids the
// Windows .cmd shim, where cmd.exe would mangle the '&'s in magnet links.
export function findPeerflix() {
  // Explicit path to peerflix's app.js, for unusual installs (and tests).
  if (process.env.MAGSEARCH_PEERFLIX) {
    return { command: process.execPath, args: [process.env.MAGSEARCH_PEERFLIX] };
  }
  const packageDirs = [path.join(PACKAGE_ROOT, '..', 'peerflix'), ...globalModuleDirs().map((d) => path.join(d, 'peerflix'))];
  try {
    packageDirs.unshift(path.dirname(createRequire(import.meta.url).resolve('peerflix/package.json')));
  } catch {
    // Not installed next to magsearch.
  }
  for (const dir of packageDirs) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.peerflix;
      if (bin && fs.existsSync(path.join(dir, bin))) {
        return { command: process.execPath, args: [path.join(dir, bin)] };
      }
    } catch {
      // Keep looking.
    }
  }
  if (onPath('peerflix')) return { command: 'peerflix', args: [], shell: process.platform === 'win32' };
  return null;
}

export function runPeerflix(args) {
  const peerflix = findPeerflix();
  if (!peerflix) {
    return Promise.reject(new Error('peerflix is not installed. Install it with: npm install -g peerflix'));
  }
  return new Promise((resolve, reject) => {
    // Quote only the arguments: a quoted command name makes cmd.exe resolve
    // %~dp0 (which npm's .cmd shims rely on) to the wrong folder.
    const child = peerflix.shell
      ? spawn(['peerflix', ...args.map((a) => `"${a}"`)].join(' '), { stdio: 'inherit', shell: true })
      : spawn(peerflix.command, [...peerflix.args, ...args], { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

// Hand a magnet (or URL) to whatever app the OS has registered for it.
export function openExternal(target) {
  const [command, args] =
    process.platform === 'win32'
      ? ['rundll32', ['url.dll,FileProtocolHandler', target]]
      : process.platform === 'darwin'
        ? ['open', [target]]
        : ['xdg-open', [target]];
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

const CLIPBOARD_COMMANDS = {
  win32: [['clip']],
  darwin: [['pbcopy']],
  default: [['wl-copy'], ['xclip', '-selection', 'clipboard'], ['xsel', '--clipboard', '--input']]
};

function pipeTo(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
    child.once('error', reject);
    child.once('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

// Resolves true if a clipboard tool accepted the text.
export async function copyToClipboard(text) {
  const commands = CLIPBOARD_COMMANDS[process.platform] ?? CLIPBOARD_COMMANDS.default;
  for (const [command, ...args] of commands) {
    try {
      await pipeTo(command, args, text);
      return true;
    } catch {
      // Try the next tool.
    }
  }
  return false;
}
