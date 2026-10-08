#!/usr/bin/env bun
/**
 * One place for version bumps + consistency checks.
 *
 *   bun scripts/version.ts bump desktop 0.5.1
 *   bun scripts/version.ts bump mobile  0.5.1
 *   bun scripts/version.ts check          (also runs in CI)
 *
 * bump  → package.json / app.json (+versionCode), desktop in-app default version,
 *         CHANGELOG stub, Play whatsnew stub (mobile), regenerated distribution/*.yml
 * check → everything above agrees, and no TODO stubs are left
 */
import fs from 'node:fs'
import path from 'node:path'
import { generateManifests } from './generate-manifests'

const root = path.resolve(__dirname, '..')
const p = (f: string) => path.join(root, f)
const read = (f: string) => fs.readFileSync(p(f), 'utf-8')
const write = (f: string, s: string) => fs.writeFileSync(p(f), s, 'utf-8')

const DESKTOP_PKG = 'apps/desktop/package.json'
const MOBILE_APP = 'apps/mobile/app.json'
const DESKTOP_APP_TSX = 'apps/desktop/src/renderer/src/App.tsx'
const WHATSNEW = { en: 'distribution/whatsnew/whatsnew-en-US', id: 'distribution/whatsnew/whatsnew-id-ID' }
const PLAY_LIMIT = 500

const codeOf = (v: string) => {
  const [a = 0, b = 0, c = 0] = v.split('.').map(Number)
  return a * 10000 + b * 100 + c
}

function bump(platform: string, raw: string) {
  const version = raw.replace(/^v/, '')
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`bad version: ${raw}`)
  const date = new Date().toISOString().slice(0, 10)

  if (platform === 'desktop') {
    const pkg = JSON.parse(read(DESKTOP_PKG))
    pkg.version = version
    write(DESKTOP_PKG, JSON.stringify(pkg, null, 2) + '\n')
    write(DESKTOP_APP_TSX, read(DESKTOP_APP_TSX).replace(/currentVersion: '[\d.]+'/, `currentVersion: '${version}'`))
  } else if (platform === 'mobile') {
    const app = JSON.parse(read(MOBILE_APP))
    app.expo.version = version
    app.expo.android.versionCode = Math.max(codeOf(version), app.expo.android.versionCode + 1)
    write(MOBILE_APP, JSON.stringify(app, null, 2) + '\n')
    write(WHATSNEW.en, `v${version} is now available!\n\n- TODO\n`)
    write(WHATSNEW.id, `v${version} telah tersedia!\n\n- TODO\n`)
  } else {
    throw new Error('platform must be desktop|mobile')
  }

  const heading = `## [v${version}-${platform}]`
  let log = read('CHANGELOG.md')
  if (!log.includes(heading)) {
    const at = log.indexOf('\n## [') + 1
    log = `${log.slice(0, at)}${heading} - ${date}\n\n### Added\n- TODO\n\n${log.slice(at)}`
    write('CHANGELOG.md', log)
  }

  generateManifests()
  console.log(`\nBumped ${platform} → ${version}. Fill the TODOs (CHANGELOG${platform === 'mobile' ? ', whatsnew' : ''}), then: bun scripts/version.ts check`)
}

function check(): string[] {
  const errs: string[] = []
  const expect = (ok: boolean, msg: string) => ok || errs.push(msg)

  const d = JSON.parse(read(DESKTOP_PKG)).version as string
  const m = JSON.parse(read(MOBILE_APP)).expo
  const mv = m.version as string
  const mc = m.android.versionCode as number
  const mp = (m.android.package as string) || 'com.pfnapp.univpn'
  expect(read(DESKTOP_APP_TSX).includes(`currentVersion: '${d}'`), `desktop App.tsx currentVersion != ${d}`)
  expect(mc === codeOf(mv), `mobile versionCode ${mc} != ${codeOf(mv)} for ${mv}`)

  // manifests: version (and versionCode) lines must match package.json / app.json
  const field = (file: string, re: RegExp) => read(file).match(re)?.[1]
  const eq = (file: string, re: RegExp, want: string | number) =>
    expect(String(field(file, re)) === String(want), `${file}: ${re.source.split('"')[0].trim()} != ${want} (run: bun scripts/generate-manifests.ts)`)
  eq('distribution/latest-win.yml', /^version: "([^"]+)"/m, d)
  eq('distribution/latest-mac.yml', /^version: "([^"]+)"/m, d)
  eq('distribution/latest-android.yml', /^version: "([^"]+)"/m, mv)
  eq('distribution/latest-android.yml', /^versionCode: (\d+)/m, mc)
  eq('distribution/latest-android.yml', /^packageId: "([^"]+)"/m, mp)
  const g = read('distribution/latest.yml')
  const platformField = (name: string, key: string) =>
    g.match(new RegExp(`^  ${name}:\\n(?:    .*\\n)*?    ${key}: "?([^"\\n]+)"?`, 'm'))?.[1]
  expect(platformField('windows', 'version') === d, `latest.yml windows.version != ${d}`)
  expect(platformField('macos', 'version') === d, `latest.yml macos.version != ${d}`)
  expect(platformField('android', 'version') === mv, `latest.yml android.version != ${mv}`)
  expect(platformField('android', 'versionCode') === String(mc), `latest.yml android.versionCode != ${mc}`)
  expect(platformField('android', 'packageId') === mp, `latest.yml android.packageId != ${mp}`)
  // changelog: separate entry per platform, no leftover stubs
  const log = read('CHANGELOG.md')
  expect(log.includes(`## [v${d}-desktop]`), `CHANGELOG missing [v${d}-desktop]`)
  expect(log.includes(`## [v${mv}-mobile]`), `CHANGELOG missing [v${mv}-mobile]`)
  expect(!/^- TODO$/m.test(log), 'CHANGELOG still has "- TODO"')

  // Play whatsnew
  for (const f of Object.values(WHATSNEW)) {
    const t = read(f)
    expect(t.startsWith(`v${mv} `), `${f} must start with v${mv}`)
    expect(!t.includes('TODO'), `${f} still has TODO`)
    expect(t.length <= PLAY_LIMIT, `${f} is ${t.length} chars (Play limit ${PLAY_LIMIT})`)
  }
  return errs
}

const [cmd, platform, version] = process.argv.slice(2)
if (cmd === 'bump') {
  bump(platform, version ?? '')
} else if (cmd === 'check') {
  const errs = check()
  if (errs.length) {
    console.error(errs.map((e) => `✗ ${e}`).join('\n'))
    process.exit(1)
  }
  console.log('✓ versions, manifests, changelog and whatsnew are consistent')
} else {
  console.error('usage: version.ts bump <desktop|mobile> <x.y.z> | check')
  process.exit(1)
}
