const THAI_MARKS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => Array.from(s).map((c) => c.toLowerCase()).filter((c) => !THAI_MARKS.test(c)).join('');

export function highlight(text, query) {
  const chars = Array.from(String(text ?? ''));
  const tokens = String(query || '').split(/\s+/).map(norm).filter(Boolean);
  if (!tokens.length) return esc(chars.join(''));

  const normArr = [], map = [];
  chars.forEach((ch, i) => { const c = ch.toLowerCase(); if (THAI_MARKS.test(c)) return; normArr.push(c); map.push(i); });
  const n = normArr.join('');

  const ranges = [];
  tokens.forEach((t) => {
    const re = new RegExp(escRe(t), 'g');
    let m;
    while ((m = re.exec(n))) {
      const eIdx = m.index + m[0].length;
      ranges.push([map[m.index], eIdx >= map.length ? chars.length : map[eIdx]]);
      if (!m[0].length) break;
    }
  });
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  ranges.forEach(([s, e]) => {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  });

  let out = '', i = 0;
  merged.forEach(([s, e]) => { out += esc(chars.slice(i, s).join('')) + '<mark>' + esc(chars.slice(s, e).join('')) + '</mark>'; i = e; });
  return out + esc(chars.slice(i).join(''));
}