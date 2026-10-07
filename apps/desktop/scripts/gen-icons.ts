// Generates desktop app icons for Windows (.ico), macOS (.icns), and Linux/Web (.png)
// from the brand icon asset.
// Run: bun run scripts/gen-icons.ts
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = join(import.meta.dir, '..')
const mobileAssets = join(root, '../mobile/assets')
const buildResourcesDir = join(root, 'build-resources')
const resourcesDir = join(root, 'resources')
const publicDir = join(root, 'src/renderer/public')

mkdirSync(buildResourcesDir, { recursive: true })
mkdirSync(resourcesDir, { recursive: true })
mkdirSync(publicDir, { recursive: true })

const svgSource = join(mobileAssets, 'brand/svg/icon-dark.svg')
const pngFallback = join(mobileAssets, 'icon.png')
const workDir = join(tmpdir(), `univpn-icons-${Date.now()}`)
mkdirSync(workDir, { recursive: true })

console.log('Generating master 1024x1024 icon...')
const masterPng = join(workDir, 'master-1024.png')

if (existsSync(svgSource)) {
  try {
    execSync(`qlmanage -t -s 1024 -o "${workDir}" "${svgSource}"`, { stdio: 'ignore' })
    const rendered = join(workDir, 'icon-dark.svg.png')
    if (existsSync(rendered)) {
      execSync(`sips -z 1024 1024 "${rendered}" --out "${masterPng}"`, { stdio: 'ignore' })
    }
  } catch {
    // fallback if qlmanage fails
  }
}

if (!existsSync(masterPng)) {
  console.log('Falling back to', pngFallback)
  execSync(`sips -z 1024 1024 "${pngFallback}" --out "${masterPng}"`, { stdio: 'ignore' })
}

// 1. Copy 1024x1024 icon to build-resources
const buildIconPng = join(buildResourcesDir, 'icon.png')
writeFileSync(buildIconPng, readFileSync(masterPng))

// 2. Generate 512x512 icon for runtime resources and renderer public
const res512Png = join(resourcesDir, 'icon.png')
execSync(`sips -z 512 512 "${masterPng}" --out "${res512Png}"`, { stdio: 'ignore' })

const publicPng = join(publicDir, 'icon.png')
execSync(`sips -z 128 128 "${masterPng}" --out "${publicPng}"`, { stdio: 'ignore' })

// 3. Generate multi-resolution Windows ICO (16, 24, 32, 48, 64, 128, 256)
console.log('Generating Windows .ico...')
function createIco(images: { width: number; height: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // 1 = icon (.ICO)
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries: Buffer[] = []
  const datas: Buffer[] = []

  for (const img of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0)
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(img.data.length, 8)
    entry.writeUInt32LE(offset, 12)

    entries.push(entry)
    datas.push(img.data)
    offset += img.data.length
  }

  return Buffer.concat([header, ...entries, ...datas])
}

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoFrames: { width: number; height: number; data: Buffer }[] = []
for (const s of icoSizes) {
  const framePath = join(workDir, `ico-${s}.png`)
  execSync(`sips -z ${s} ${s} "${masterPng}" --out "${framePath}"`, { stdio: 'ignore' })
  icoFrames.push({ width: s, height: s, data: readFileSync(framePath) })
}

const icoBuffer = createIco(icoFrames)
writeFileSync(join(buildResourcesDir, 'icon.ico'), icoBuffer)
writeFileSync(join(resourcesDir, 'icon.ico'), icoBuffer)
writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer)

// 4. Generate macOS ICNS using iconutil
console.log('Generating macOS .icns...')
const iconsetDir = join(workDir, 'icon.iconset')
mkdirSync(iconsetDir, { recursive: true })
const iconsetSizes: [string, number][] = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
]

for (const [filename, size] of iconsetSizes) {
  execSync(`sips -z ${size} ${size} "${masterPng}" --out "${join(iconsetDir, filename)}"`, { stdio: 'ignore' })
}

const tmpIcns = join(workDir, 'icon.icns')
execSync(`iconutil -c icns "${iconsetDir}" -o "${tmpIcns}"`)
const icnsBuffer = readFileSync(tmpIcns)
writeFileSync(join(buildResourcesDir, 'icon.icns'), icnsBuffer)
writeFileSync(join(resourcesDir, 'icon.icns'), icnsBuffer)

// Cleanup
try {
  rmSync(workDir, { recursive: true, force: true })
} catch {}

console.log('Successfully generated icons:')
console.log(' - build-resources/icon.icns')
console.log(' - build-resources/icon.ico')
console.log(' - build-resources/icon.png')
console.log(' - resources/icon.png')
console.log(' - resources/icon.ico')
console.log(' - resources/icon.icns')
console.log(' - src/renderer/public/icon.png')
console.log(' - src/renderer/public/favicon.ico')
