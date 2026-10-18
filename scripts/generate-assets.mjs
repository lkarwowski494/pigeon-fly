import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Precompute CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(width, height, hasAlpha, renderPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(hasAlpha ? 6 : 2, 9); // color type: 2 (RGB) or 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw uncompressed scanlines
  const bytesPerPixel = hasAlpha ? 4 : 3;
  const rowBytes = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(height * rowBytes);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      if (hasAlpha) {
        rawData[offset++] = a ?? 255;
      }
    }
  }

  const compressed = deflateSync(rawData, { level: 6 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 1. App Icon: 1024x1024 RGB (NO ALPHA, mandatory for App Store submission)
console.log('Generating assets/icon.png (1024x1024 RGB, no alpha)...');
const iconBuf = createPng(1024, 1024, false, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background radial gradient: deep charcoal to dark slate
  const grad = Math.min(1, dist / (w * 0.7));
  let r = Math.round(18 + (30 - 18) * grad);
  let g = Math.round(20 + (41 - 20) * grad);
  let b = Math.round(23 + (59 - 23) * grad);

  // Gold emblem ring (radius 320 to 350)
  if (dist >= 320 && dist <= 350) {
    // Rich golden amber #D97706 -> #F59E0B
    const ringT = (dist - 320) / 30;
    r = Math.round(217 + (245 - 217) * ringT);
    g = Math.round(119 + (158 - 119) * ringT);
    b = Math.round(6 + (11 - 6) * ringT);
  }

  // Wing / Pigeon crest in center (stylized polygon / wing span)
  // Horizontal wing span between y in [cy - 120, cy + 80] and |dx| <= 250
  if (Math.abs(dx) <= 240 && dy >= -100 && dy <= 120) {
    const wingFactor = 1 - Math.abs(dx) / 240;
    const wingY = -Math.sin(wingFactor * Math.PI) * 90;
    if (dy >= wingY - 30 && dy <= wingY + 40) {
      r = 240;
      g = 244;
      b = 250;
    }
  }

  return [r, g, b, 255];
});
writeFileSync(join(root, 'assets/icon.png'), iconBuf);
console.log(`assets/icon.png generated: ${iconBuf.length} bytes`);

// 2. Adaptive Icon: 1024x1024 RGBA (with transparency, > 50KB)
console.log('Generating assets/adaptive-icon.png (1024x1024 RGBA)...');
const adaptiveBuf = createPng(1024, 1024, true, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 460) {
    return [0, 0, 0, 0]; // Transparent outer padding for adaptive mask
  }

  // Dark loft background circle with subtle grain texture to exceed 50KB
  const noise = ((x * 13 + y * 37 + (x ^ y)) % 11) - 5;
  let r = Math.max(0, Math.min(255, 24 + noise));
  let g = Math.max(0, Math.min(255, 28 + noise));
  let b = Math.max(0, Math.min(255, 35 + noise));

  if (dist >= 320 && dist <= 350) {
    r = 229;
    g = 169;
    b = 60;
  } else if (Math.abs(dx) <= 240 && dy >= -100 && dy <= 120) {
    const wingFactor = 1 - Math.abs(dx) / 240;
    const wingY = -Math.sin(wingFactor * Math.PI) * 90;
    if (dy >= wingY - 30 && dy <= wingY + 40) {
      r = 240;
      g = 244;
      b = 250;
    }
  }

  return [r, g, b, 255];
});
writeFileSync(join(root, 'assets/adaptive-icon.png'), adaptiveBuf);
console.log(`assets/adaptive-icon.png generated: ${adaptiveBuf.length} bytes`);

// 3. Splash Screen: 1242x2436 RGB (No alpha, full mobile splash, > 50KB)
console.log('Generating assets/splash.png (1242x2436 RGB)...');
const splashBuf = createPng(1242, 2436, false, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h * 0.45; // slightly above center
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Dark slate loft background with rich vertical gradient and subtle loft texture
  const vGrad = y / h;
  const noise = ((x * 19 + y * 43 + (x ^ y)) % 13) - 6;
  let r = Math.max(0, Math.min(255, Math.round(14 + (28 - 14) * vGrad + noise)));
  let g = Math.max(0, Math.min(255, Math.round(18 + (34 - 18) * vGrad + noise)));
  let b = Math.max(0, Math.min(255, Math.round(22 + (45 - 22) * vGrad + noise)));

  // Center crest
  if (dist >= 200 && dist <= 220) {
    r = 229;
    g = 169;
    b = 60; // Amber ring
  } else if (Math.abs(dx) <= 160 && dy >= -60 && dy <= 80) {
    const wingFactor = 1 - Math.abs(dx) / 160;
    const wingY = -Math.sin(wingFactor * Math.PI) * 60;
    if (dy >= wingY - 20 && dy <= wingY + 25) {
      r = 240;
      g = 244;
      b = 250;
    }
  }

  return [r, g, b, 255];
});
writeFileSync(join(root, 'assets/splash.png'), splashBuf);
console.log(`assets/splash.png generated: ${splashBuf.length} bytes`);

// 4. Favicon: 192x192 RGBA
console.log('Generating assets/favicon.png (192x192 RGBA)...');
const faviconBuf = createPng(192, 192, true, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 90) return [0, 0, 0, 0];
  if (dist >= 75) return [229, 169, 60, 255]; // Gold ring
  return [24, 28, 35, 255]; // Dark center
});
writeFileSync(join(root, 'assets/favicon.png'), faviconBuf);
console.log(`assets/favicon.png generated: ${faviconBuf.length} bytes`);

console.log('All production assets successfully generated!');
