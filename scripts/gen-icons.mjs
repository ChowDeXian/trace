// Generates the PWA icons (dark tile + green mood-trace line) as PNGs with zero deps.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(size, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // no filter
    rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const BG = [13, 13, 13];
const FG = [48, 196, 141];

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) px.set(BG, i * 3);
  const dot = (cx, cy, r) => {
    for (let y = Math.round(cy - r); y <= Math.round(cy + r); y++) {
      for (let x = Math.round(cx - r); x <= Math.round(cx + r); x++) {
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px.set(FG, (y * size + x) * 3);
      }
    }
  };
  // rising mood-trace polyline through four points, thick stroke + end dot
  const pts = [
    [0.20, 0.62],
    [0.42, 0.72],
    [0.60, 0.42],
    [0.80, 0.30],
  ].map(([x, y]) => [x * size, y * size]);
  const w = 0.045 * size;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= steps; s++) {
      dot(x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, w);
    }
  }
  dot(pts[3][0], pts[3][1], 0.085 * size); // end dot
  return px;
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(outDir, name), png(size, drawIcon(size)));
  console.log(`wrote public/icons/${name}`);
}
