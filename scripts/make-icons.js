/* make-icons.js — generuje ikony PWA bez żadnych zależności.
 *
 * Uruchomienie:  node scripts/make-icons.js
 * Wynik:         img/icon-192.png, img/icon-512.png, img/icon-512-maskable.png
 *
 * Rysujemy w 4-krotnym powiększeniu i zmniejszamy — daje wygładzone krawędzie
 * bez żadnej biblioteki graficznej.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'img');
const SS = 4; // supersampling

/* ---------- płótno ---------- */

function canvas(size) {
  return { w: size, h: size, px: new Uint8Array(size * size * 4) };
}

function setPx(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  if (a === 255) {
    c.px[i] = r; c.px[i + 1] = g; c.px[i + 2] = b; c.px[i + 3] = 255;
    return;
  }
  const af = a / 255, ia = 1 - af;
  c.px[i] = Math.round(r * af + c.px[i] * ia);
  c.px[i + 1] = Math.round(g * af + c.px[i + 1] * ia);
  c.px[i + 2] = Math.round(b * af + c.px[i + 2] * ia);
  c.px[i + 3] = Math.max(c.px[i + 3], a);
}

function fillRect(c, x0, y0, w, h, col) {
  for (let y = Math.floor(y0); y < y0 + h; y++)
    for (let x = Math.floor(x0); x < x0 + w; x++) setPx(c, x, y, col);
}

function fillRoundRect(c, x0, y0, w, h, r, col) {
  for (let y = Math.floor(y0); y < y0 + h; y++) {
    for (let x = Math.floor(x0); x < x0 + w; x++) {
      const dx = Math.max(x0 + r - x, 0, x - (x0 + w - r - 1));
      const dy = Math.max(y0 + r - y, 0, y - (y0 + h - r - 1));
      if (dx * dx + dy * dy <= r * r) setPx(c, x, y, col);
    }
  }
}

function fillCircle(c, cx, cy, r, col) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(c, x, y, col);
    }
}

function fillTriangle(c, p1, p2, p3, col) {
  const minX = Math.floor(Math.min(p1[0], p2[0], p3[0]));
  const maxX = Math.ceil(Math.max(p1[0], p2[0], p3[0]));
  const minY = Math.floor(Math.min(p1[1], p2[1], p3[1]));
  const maxY = Math.ceil(Math.max(p1[1], p2[1], p3[1]));
  const sign = (a, b, p) => (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const p = [x, y];
      const d1 = sign(p1, p2, p), d2 = sign(p2, p3, p), d3 = sign(p3, p1, p);
      const neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      if (!(neg && pos)) setPx(c, x, y, col);
    }
  }
}

function downsample(big, factor) {
  const size = big.w / factor;
  const out = canvas(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = ((y * factor + dy) * big.w + (x * factor + dx)) * 4;
          r += big.px[i]; g += big.px[i + 1]; b += big.px[i + 2]; a += big.px[i + 3];
        }
      }
      const n = factor * factor;
      const i = (y * size + x) * 4;
      out.px[i] = Math.round(r / n);
      out.px[i + 1] = Math.round(g / n);
      out.px[i + 2] = Math.round(b / n);
      out.px[i + 3] = Math.round(a / n);
    }
  }
  return out;
}

/* ---------- zapis PNG ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function writePng(c, file) {
  const raw = Buffer.alloc((c.w * 4 + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 4 + 1)] = 0; // filtr: none
    Buffer.from(c.px.buffer, y * c.w * 4, c.w * 4)
      .copy(raw, y * (c.w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8;   // głębia
  ihdr[9] = 6;   // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

/* ---------- rysunek ikony ---------- */

const GRANAT = [55, 71, 79, 255];
const BIALY = [255, 255, 255, 255];
const BURSZTYN = [255, 179, 0, 255];

function drawIcon(size, inset) {
  const c = canvas(size * SS);
  const S = size * SS;
  const pad = Math.round(S * inset);
  const box = S - 2 * pad;

  // tło
  fillRoundRect(c, 0, 0, S, S, Math.round(S * 0.18), GRANAT);

  // dymek
  const bx = pad, by = pad + box * 0.06;
  const bw = box, bh = box * 0.62;
  fillRoundRect(c, bx, by, bw, bh, bh * 0.26, BIALY);
  fillTriangle(c,
    [bx + bw * 0.24, by + bh - 2],
    [bx + bw * 0.20, by + bh + box * 0.26],
    [bx + bw * 0.56, by + bh - 2],
    BIALY);

  // trzy kropki = mowa
  const r = bh * 0.11;
  const cy = by + bh * 0.46;
  [0.28, 0.5, 0.72].forEach((f, i) => {
    fillCircle(c, bx + bw * f, cy, r, i === 1 ? BURSZTYN : GRANAT);
  });

  return downsample(c, SS);
}

/* ---------- start ---------- */

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const jobs = [
  ['icon-192.png', 192, 0.12],
  ['icon-512.png', 512, 0.12],
  ['icon-512-maskable.png', 512, 0.22]   // większy margines: strefa bezpieczna
];

jobs.forEach(([name, size, inset]) => {
  const img = drawIcon(size, inset);
  const bytes = writePng(img, path.join(OUT_DIR, name));
  console.log(name + '  ' + size + 'x' + size + '  ' + bytes + ' B');
});
