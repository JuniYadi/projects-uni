// Generates tray PNGs (4 states × mac template / windows color) into resources/tray.
// Run: bun run scripts/gen-tray.ts   (no deps: tiny rasterizer + zlib)
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type Pt = [number, number]
const STATES = ['idle', 'connecting', 'connected', 'failed'] as const
type State = (typeof STATES)[number]

// Shield from mobile icon set (24 grid), cubic segments flattened.
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 12): Pt[] {
  const out: Pt[] = []
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t
    out.push([
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ])
  }
  return out
}
const SHIELD: Pt[] = [
  [12, 3], [20, 6], [20, 12],
  ...cubic([20, 12], [20, 17], [16.6, 20.4], [12, 21]),
  ...cubic([12, 21], [7.4, 20.4], [4, 17], [4, 12]),
  [4, 6],
]

const dist = (a: Pt, b: Pt, p: Pt) => {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
  return { d: Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy), s: t * Math.hypot(dx, dy) }
}
function inside(poly: Pt[], [x, y]: Pt) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
// distance to closed polyline + arc position along it (for dashes)
function outline(p: Pt) {
  let best = { d: Infinity, s: 0 }, acc = 0
  for (let i = 0; i < SHIELD.length; i++) {
    const a = SHIELD[i], b = SHIELD[(i + 1) % SHIELD.length]
    const r = dist(a, b, p)
    if (r.d < best.d) best = { d: r.d, s: acc + r.s }
    acc += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return best
}
// power glyph: arc open at top + vertical bar
const PC: Pt = [12, 12.6], PR = 3.6
function power(p: Pt, w: number) {
  const bar = dist([12, 8.4], [12, 12.4], p).d <= w / 2
  const ang = (Math.atan2(p[0] - PC[0], -(p[1] - PC[1])) * 180) / Math.PI // 0 = top
  const ring = Math.abs(Math.hypot(p[0] - PC[0], p[1] - PC[1]) - PR) <= w / 2 && Math.abs(ang) > 42
  return bar || ring
}

const SW = 2 // stroke width in 24 grid
// returns 'fg' | 'dot' | null for a sample point
function sample(state: State, p: Pt): 'fg' | 'dot' | null {
  if (state === 'failed' && Math.hypot(p[0] - 18.6, p[1] - 5.4) <= 3.4) return 'dot'
  if (state === 'connected') return inside(SHIELD, p) && !power(p, 1.9) ? 'fg' : null
  const o = outline(p)
  const onLine = o.d <= SW / 2 && (state !== 'connecting' || o.s % 3.4 < 2.1)
  return onLine || power(p, 1.9) ? 'fg' : null
}

const RGB = { win: { fg: [226, 232, 240], connected: [34, 197, 94], dot: [248, 113, 113] }, mac: { fg: [0, 0, 0], connected: [0, 0, 0], dot: [0, 0, 0] } } as const

function render(state: State, size: number, variant: 'win' | 'mac') {
  const SS = 4, k = 24 / size
  const px = Buffer.alloc(size * size * 4)
  const pal = RGB[variant]
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let fg = 0, dot = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const r = sample(state, [(x + (sx + 0.5) / SS) * k, (y + (sy + 0.5) / SS) * k])
          if (r === 'fg') fg++
          else if (r === 'dot') dot++
        }
      const n = SS * SS, a = (fg + dot) / n
      const c = dot > fg ? pal.dot : state === 'connected' ? pal.connected : pal.fg
      const i = (y * size + x) * 4
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = Math.round(a * 255)
    }
  return png(size, px)
}

function crc32(buf: Buffer) {
  let c, crc = 0xffffffff
  for (const b of buf) {
    c = (crc ^ b) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size: number, rgba: Buffer) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = join(import.meta.dir, '../resources/tray')
mkdirSync(out, { recursive: true })
for (const state of STATES) {
  // Windows: colored, 16/20/32/64 (100/125/200/400% DPI)
  for (const s of [16, 20, 32, 64]) writeFileSync(join(out, `win-${state}-${s}.png`), render(state, s, 'win'))
  // macOS: template (name ends in Template; 18pt + @2x)
  writeFileSync(join(out, `mac-${state}Template.png`), render(state, 18, 'mac'))
  writeFileSync(join(out, `mac-${state}Template@2x.png`), render(state, 36, 'mac'))
}
console.log('tray icons →', out)
