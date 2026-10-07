import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = path.resolve(root, '../../packages/vpn-platform/src/wg-helper.ts')
const resDir = path.resolve(root, 'resources')
const winDir = path.resolve(resDir, 'win')
const resExe = path.resolve(resDir, 'wg-helper.exe')
const winExe = path.resolve(winDir, 'wg-helper.exe')

console.log('Compiling Windows helper (bun-windows-x64)...')
mkdirSync(resDir, { recursive: true })
mkdirSync(winDir, { recursive: true })

const res = spawnSync(
  'bun',
  ['build', '--compile', '--target=bun-windows-x64', source, '--outfile', resExe],
  { stdio: 'inherit' }
)
if (res.status !== 0) process.exit(res.status ?? 1)

copyFileSync(resExe, winExe)
console.log('Successfully compiled Windows helper to', resExe, 'and', winExe)

// Co-locate DLLs in root resources if they exist in resources/win
const tunnelDll = path.join(winDir, 'tunnel.dll')
const wgDll = path.join(winDir, 'wireguard.dll')
if (existsSync(tunnelDll)) {
  copyFileSync(tunnelDll, path.join(resDir, 'tunnel.dll'))
}
if (existsSync(wgDll)) {
  copyFileSync(wgDll, path.join(resDir, 'wireguard.dll'))
}
