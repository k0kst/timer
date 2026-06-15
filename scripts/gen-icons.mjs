// Generates BountyTimer PWA icons as real PNGs without any image libraries,
// using only Node's built-in zlib. Draws the "clock ring" motif:
// a navy rounded square with a teal progress ring and a small marker.
//
// Run: node scripts/gen-icons.mjs   (also runs automatically on `npm run icons`)

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public')
mkdirSync(OUT, { recursive: true })

const NAVY = [11, 31, 47]
const NAVY2 = [15, 42, 63]
const TEAL = [52, 208, 192]
const INK = [234, 242, 246]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function png(size, draw) {
  const bytesPerRow = size * 4
  const raw = Buffer.alloc((bytesPerRow + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (bytesPerRow + 1)] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y)
      const off = y * (bytesPerRow + 1) + 1 + x * 4
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
      raw[off + 3] = a
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function makeIcon(size, { maskable } = {}) {
  const c = size / 2
  const pad = maskable ? size * 0.04 : size * 0.12 // safe zone for maskable
  const radius = c - pad
  const ringW = size * 0.075
  const corner = size * 0.22
  return png(size, (x, y) => {
    // Rounded-square navy background with a subtle vertical gradient.
    const inCorner = (() => {
      const rx = Math.min(x, size - 1 - x)
      const ry = Math.min(y, size - 1 - y)
      if (rx < corner && ry < corner) {
        const dx = corner - rx
        const dy = corner - ry
        return dx * dx + dy * dy > corner * corner
      }
      return false
    })()
    if (inCorner) return [0, 0, 0, 0]
    const bg = mix(NAVY2, NAVY, y / size)

    const dx = x - c
    const dy = y - c
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ang = Math.atan2(dy, dx) // -PI..PI

    // Teal progress ring (about 75% sweep, starting at top).
    const ringOuter = radius
    const ringInner = radius - ringW
    if (dist <= ringOuter && dist >= ringInner) {
      let deg = (ang * 180) / Math.PI + 90 // 0 at top, clockwise
      if (deg < 0) deg += 360
      if (deg <= 270) {
        return [...TEAL, 255]
      }
      return [...mix(NAVY, INK, 0.08), 255]
    }

    // Center "play" triangle marker.
    const triR = radius * 0.42
    if (dist < triR) {
      const px = dx + triR * 0.18
      if (px > -triR * 0.5 && px < triR * 0.55) {
        const slope = (triR * 0.6 - Math.abs(dy)) / (triR * 0.6)
        if (slope > 0 && px < triR * 0.55 * slope) return [...TEAL, 255]
      }
    }

    return [...bg, 255]
  })
}

writeFileSync(join(OUT, 'icon-192.png'), makeIcon(192))
writeFileSync(join(OUT, 'icon-512.png'), makeIcon(512))
writeFileSync(join(OUT, 'icon-maskable-512.png'), makeIcon(512, { maskable: true }))
writeFileSync(join(OUT, 'apple-touch-icon.png'), makeIcon(180, { maskable: true }))
console.log('✓ Icons written to public/')
