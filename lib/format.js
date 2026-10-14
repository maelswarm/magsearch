// Formatting helpers for terminal output: sizes, ages, colors and
// width-aware truncation (torrent names often contain CJK or emoji).

const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

export function formatSize(bytes) {
  let value = Number(bytes) || 0;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  if (unit === 0) return `${value} B`;
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

export function formatAge(unixSeconds, now = Date.now()) {
  if (!unixSeconds) return '';
  const seconds = Math.max(0, now / 1000 - unixSeconds);
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  if (minutes < 1) return 'now';
  if (hours < 1) return `${Math.floor(minutes)}m`;
  if (days < 1) return `${Math.floor(hours)}h`;
  if (days < 30) return `${Math.floor(days)}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

// Names come from an untrusted API: strip control characters (which could
// smuggle terminal escape sequences) and bidi overrides.
export function sanitize(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function charWidth(cp) {
  if (
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) ||
    (cp >= 0x200b && cp <= 0x200f) ||
    (cp >= 0x20d0 && cp <= 0x20ff) ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0xfe20 && cp <= 0xfe2f) ||
    cp === 0x2060 ||
    cp === 0xfeff
  ) {
    return 0;
  }
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  ) {
    return 2;
  }
  return 1;
}

const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;

export function stripAnsi(text) {
  return String(text).replace(ANSI, '');
}

export function stringWidth(text) {
  let width = 0;
  for (const ch of stripAnsi(text)) width += charWidth(ch.codePointAt(0));
  return width;
}

// Truncate plain (unstyled) text to `width` columns, ending with an ellipsis.
export function truncate(text, width) {
  if (width <= 0) return '';
  if (stringWidth(text) <= width) return text;
  let out = '';
  let used = 0;
  for (const ch of text) {
    const w = charWidth(ch.codePointAt(0));
    if (used + w > width - 1) break;
    out += ch;
    used += w;
  }
  return out + '…';
}

// Keep the end of the text visible (used for the search box).
export function truncateStart(text, width) {
  if (width <= 0) return '';
  if (stringWidth(text) <= width) return text;
  const chars = Array.from(text);
  let out = '';
  let used = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    const w = charWidth(chars[i].codePointAt(0));
    if (used + w > width - 1) break;
    out = chars[i] + out;
    used += w;
  }
  return '…' + out;
}

export function padEnd(text, width) {
  return text + ' '.repeat(Math.max(0, width - stringWidth(text)));
}

export function padStart(text, width) {
  return ' '.repeat(Math.max(0, width - stringWidth(text))) + text;
}

export function shouldUseColor(stream) {
  return Boolean(stream.isTTY) && !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb';
}

export function createStyle(enabled) {
  const wrap = (open, close) =>
    enabled ? (s) => `\x1b[${open}m${s}\x1b[${close}m` : (s) => String(s);
  return {
    enabled,
    bold: wrap(1, 22),
    dim: wrap(2, 22),
    underline: wrap(4, 24),
    inverse: wrap(7, 27),
    red: wrap(31, 39),
    green: wrap(32, 39),
    yellow: wrap(33, 39),
    blue: wrap(34, 39),
    magenta: wrap(35, 39),
    cyan: wrap(36, 39),
    gray: wrap(90, 39),
    highlight: enabled ? '\x1b[48;5;236m' : '',
    reset: enabled ? '\x1b[0m' : ''
  };
}
