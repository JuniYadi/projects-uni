import { spawnSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const source = path.resolve(root, '../../packages/vpn-platform/src/mac-helper.ts')
const outDir = path.resolve(root, 'resources/mac')
const arm64Out = path.resolve(outDir, 'univpn-helper-arm64')
const x64Out = path.resolve(outDir, 'univpn-helper-x64')
const universalOut = path.resolve(outDir, 'univpn-helper')

console.log('Compiling mac helper for arm64...')
const b1 = spawnSync('bun', ['build', '--compile', '--target=bun-darwin-arm64', source, '--outfile', arm64Out], { stdio: 'inherit' })
if (b1.status !== 0) process.exit(b1.status ?? 1)

console.log('Compiling mac helper for x64...')
const b2 = spawnSync('bun', ['build', '--compile', '--target=bun-darwin-x64', source, '--outfile', x64Out], { stdio: 'inherit' })
if (b2.status !== 0) process.exit(b2.status ?? 1)

console.log('Creating universal binary with lipo...')
const lipo = spawnSync('lipo', ['-create', '-output', universalOut, arm64Out, x64Out], { stdio: 'inherit' })
if (existsSync(arm64Out)) unlinkSync(arm64Out)
if (existsSync(x64Out)) unlinkSync(x64Out)
if (lipo.status !== 0) process.exit(lipo.status ?? 1)

console.log('Successfully created universal mac helper at', universalOut)
