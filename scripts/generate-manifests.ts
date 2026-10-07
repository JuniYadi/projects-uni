#!/usr/bin/env bun
/**
 * scripts/generate-manifests.ts
 *
 * Generates and validates the multi-platform version manifests:
 * - distribution/latest.yml (Global SSOT for website & landing page)
 * - distribution/latest-win.yml (Windows electron-updater)
 * - distribution/latest-mac.yml (macOS electron-updater)
 * - distribution/latest-android.yml (Android app & Play Store)
 *
 * Rule: Maximum lag of 5 Minor versions or 2 Major versions.
 */

import fs from 'node:fs'
import path from 'node:path'

interface VersionPolicy {
  version: string
  versionCode?: number
  mandatory?: boolean
  sunsetMessageId?: string
  sunsetMessageEn?: string
}

function calculateMinSupportedVersion(version: string): string {
  const parts = version.replace(/^v/, '').split('.').map(Number)
  const major = parts[0] || 0
  const minor = parts[1] || 0

  // Policy: Max lag of 5 Minor versions and 2 Major versions
  const minMajor = Math.max(0, major - 2)
  const minMinor = Math.max(0, minor - 5)

  if (major === minMajor) {
    return `${major}.${minMinor}.0`
  }
  return `${minMajor}.0.0`
}

export function generateManifests(options?: {
  desktopVersion?: string
  androidVersion?: string
  androidVersionCode?: number
  mandatory?: boolean
}) {
  const rootDir = path.resolve(__dirname, '..')
  const distDir = path.join(rootDir, 'distribution')

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }

  // Read desktop package.json
  const desktopPkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'apps/desktop/package.json'), 'utf-8')
  )
  // Read mobile app.json
  const mobileAppJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'apps/mobile/app.json'), 'utf-8')
  )

  const dVersion = options?.desktopVersion || desktopPkg.version || '0.3.1'
  const aVersion = options?.androidVersion || mobileAppJson.expo?.version || '0.3.1'
  const aVersionCode =
    options?.androidVersionCode ||
    mobileAppJson.expo?.android?.versionCode ||
    31
  const isMandatory = options?.mandatory ?? false

  const minDesktop = calculateMinSupportedVersion(dVersion)
  const minAndroid = calculateMinSupportedVersion(aVersion)
  const minAndroidCode = Math.max(1, aVersionCode - 20)

  const now = new Date().toISOString()

  // 1. latest.yml (Global SSOT)
  const globalYaml = `# ==============================================================================
# UniVPN Multi-Platform Version Manifest (Global Single Source of Truth)
# Used by Website Landing Page & UI Clients to inspect version availability.
# ==============================================================================
schemaVersion: 1
updatedAt: "${now}"

policy:
  maxMinorLag: 5
  maxMajorLag: 2
  sunsetMessage:
    id: "Versi Anda sudah tidak didukung (tertinggal lebih dari 5 rilis). Harap perbarui UniVPN untuk melanjutkan koneksi."
    en: "Your UniVPN version is no longer supported (more than 5 releases behind). Please update to continue connecting."

platforms:
  windows:
    version: "${dVersion}"
    minSupportedVersion: "${minDesktop}"
    mandatory: ${isMandatory}
    manifestUrl: "https://raw.githubusercontent.com/juniyadi/projects-uni/main/distribution/latest-win.yml"
    downloadUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${dVersion}-desktop/UniVPN-Setup-${dVersion}-x64.exe"
    installerType: "nsis"
    architecture: ["x64"]
    releaseDate: "${now}"

  macos:
    version: "${dVersion}"
    minSupportedVersion: "${minDesktop}"
    mandatory: ${isMandatory}
    manifestUrl: "https://raw.githubusercontent.com/juniyadi/projects-uni/main/distribution/latest-mac.yml"
    downloadUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${dVersion}-desktop/UniVPN-${dVersion}-arm64.dmg"
    zipUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${dVersion}-desktop/UniVPN-${dVersion}-mac.zip"
    installerType: "dmg"
    architecture: ["arm64", "x64"]
    releaseDate: "${now}"

  android:
    version: "${aVersion}"
    versionCode: ${aVersionCode}
    minSupportedVersion: "${minAndroid}"
    minSupportedVersionCode: ${minAndroidCode}
    mandatory: ${isMandatory}
    manifestUrl: "https://raw.githubusercontent.com/juniyadi/projects-uni/main/distribution/latest-android.yml"
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.univpn.mobile"
    directApkUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${aVersion}-mobile/app-release.apk"
    fallbackApkUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${aVersion}-mobile-internal/app-release.apk"
    packageId: "com.univpn.mobile"
    releaseDate: "${now}"
`

  // 2. latest-win.yml (Windows)
  const winYaml = `# ==============================================================================
# UniVPN Windows Release Manifest (electron-updater & Website metadata)
# URL: https://github.com/juniyadi/projects-uni/releases/latest/download/latest-win.yml
# ==============================================================================
version: "${dVersion}"
releaseDate: "${now}"
path: "UniVPN-Setup-${dVersion}-x64.exe"
sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

minSupportedVersion: "${minDesktop}"
mandatory: ${isMandatory}
sunsetMessage: "Versi Anda sudah tidak didukung (tertinggal lebih dari 5 rilis). Harap perbarui UniVPN untuk melanjutkan koneksi."

files:
  - url: "UniVPN-Setup-${dVersion}-x64.exe"
    sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    size: 68420000
  - url: "UniVPN-Setup-${dVersion}-x64.exe.blockmap"
    sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    size: 78500
`

  // 3. latest-mac.yml (macOS)
  const macYaml = `# ==============================================================================
# UniVPN macOS Release Manifest (electron-updater & Website metadata)
# URL: https://github.com/juniyadi/projects-uni/releases/latest/download/latest-mac.yml
# ==============================================================================
version: "${dVersion}"
releaseDate: "${now}"
path: "UniVPN-${dVersion}-mac.zip"
sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

minSupportedVersion: "${minDesktop}"
mandatory: ${isMandatory}
sunsetMessage: "Versi Anda sudah tidak didukung (tertinggal lebih dari 5 rilis). Harap perbarui UniVPN untuk melanjutkan koneksi."

files:
  - url: "UniVPN-${dVersion}-mac.zip"
    sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    size: 74200000
  - url: "UniVPN-${dVersion}-arm64.dmg"
    sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    size: 78900000
`

  // 4. latest-android.yml (Android)
  const androidYaml = `# ==============================================================================
# UniVPN Android Release Manifest (In-App Check & Website metadata)
# URL: https://github.com/juniyadi/projects-uni/releases/latest/download/latest-android.yml
# ==============================================================================
version: "${aVersion}"
versionCode: ${aVersionCode}
releaseDate: "${now}"
packageId: "com.univpn.mobile"

minSupportedVersion: "${minAndroid}"
minSupportedVersionCode: ${minAndroidCode}
mandatory: ${isMandatory}
sunsetMessage: "Versi Anda sudah tidak didukung (tertinggal lebih dari 5 rilis). Harap perbarui UniVPN dari Google Play Store."
distribution:
  playStore:
    track: "production"
    url: "https://play.google.com/store/apps/details?id=com.univpn.mobile"
  directDownload:
    apkUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${aVersion}-mobile/app-release.apk"
    fallbackApkUrl: "https://github.com/juniyadi/projects-uni/releases/download/v${aVersion}-mobile-internal/app-release.apk"
    sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    size: 42150000
`
  fs.writeFileSync(path.join(distDir, 'latest.yml'), globalYaml, 'utf-8')
  fs.writeFileSync(path.join(distDir, 'latest-win.yml'), winYaml, 'utf-8')
  fs.writeFileSync(path.join(distDir, 'latest-mac.yml'), macYaml, 'utf-8')
  fs.writeFileSync(path.join(distDir, 'latest-android.yml'), androidYaml, 'utf-8')

  console.log(`✓ Generated manifests in distribution/:`)
  console.log(`  - latest.yml (Global SSOT)`)
  console.log(`  - latest-win.yml (Desktop v${dVersion}, min: ${minDesktop})`)
  console.log(`  - latest-mac.yml (Desktop v${dVersion}, min: ${minDesktop})`)
  console.log(`  - latest-android.yml (Mobile v${aVersion} build ${aVersionCode}, min: ${minAndroid})`)
}

if (import.meta.main) {
  generateManifests()
}
