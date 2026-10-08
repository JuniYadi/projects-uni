# Changelog

All notable changes to UniVPN are documented here.

## [v0.5.1-mobile] - 2026-10-08

### Fixed
- **Mobile**: Memperbaiki missing import `create` dari `zustand` pada `connectionStore` yang menyebabkan error inisialisasi store koneksi.
- **Mobile**: Menambahkan parameter `buttonStyle` dan `renderActions` yang terlewat pada komponen `ConnectionStatus` agar styling tombol beranda dan kontrol aksi berfungsi dengan tepat.

## [v0.5.0-desktop] - 2026-10-08

### Added
- **Desktop**: Logout otomatis saat perangkat dicabut (`DEVICE_REVOKED`): sesi dihapus, terowongan VPN dihentikan, lalu pengguna kembali ke layar Masuk dengan dialog "Perangkat dicabut" dan tombol "Masuk Kembali".

### Fixed
- **Desktop**: Sesi yang ditolak server (`TOKEN_INVALID` / 401) kini juga me-reset status login di UI, bukan hanya menghapus token.
- **Desktop**: Catatan pembaruan pada dialog update kini dirender sebagai HTML (judul, daftar, tebal, kode) alih-alih menampilkan tag mentah.

## [v0.5.0-mobile] - 2026-10-08

### Added
- **Mobile**: Layar "Perangkat dicabut" dan logout otomatis saat perangkat dicabut (`DEVICE_REVOKED`): sesi dihapus, terowongan VPN dan heartbeat dihentikan, lalu pengguna diarahkan ke layar dengan tombol "Masuk Kembali". Berlaku juga saat aplikasi dibuka ulang.
- **Mobile**: Tombol toggle mata untuk menampilkan/menyembunyikan ID Langganan pada layar detail Akun, serta masking otomatis (`UNI-••••-72QX`) pada baris ringkasan Akun di Pengaturan.

### Changed
- **Mobile**: Endpoint WireGuard memprioritaskan IP server dibanding domain, dengan fallback ke hostname bila IP tidak tersedia.

### Fixed
- **Mobile**: Sesi yang ditolak server (`TOKEN_INVALID` / 401) kini juga me-reset status login di UI, bukan hanya menghapus token.

## [v0.4.6-desktop] - 2026-10-08

### Added
- **Desktop & Mobile**: Masking ID Langganan (`UNI-••••-72QX`) untuk perlindungan privasi credential saat membuka menu pengaturan atau screen share.
- **Desktop**: Tombol toggle mata (tampilkan/sembunyikan ID) dan tombol Salin ID ke clipboard pada kartu ID Langganan di tab Pengaturan.
- **Mobile**: Tombol toggle mata untuk menampilkan/menyembunyikan ID Langganan pada layar detail Akun, serta masking otomatis pada baris ringkasan Akun di Pengaturan.

## [v0.4.5-desktop] - 2026-10-08

### Added
- **Desktop**: Mode DNS Kustom (Otomatis, Cloudflare `1.1.1.1`, Google `8.8.8.8`, AdGuard `94.140.14.14`) pada menu Mode Lanjutan yang diinjeksikan secara otomatis ke konfigurasi interface WireGuard (`applyDnsPreference`).
- **Desktop**: Sistem pemfilteran dan pengurutan lokasi server yang diselaraskan dengan aplikasi mobile, termasuk modal filter lokasi (berdasarkan wilayah, server favorit, dan urutan latensi/nama) serta kartu rekomendasi server tercepat.

### Fixed
- **Windows**: Memperbaiki variabel jalur registri/direktori uninstaller NSIS dari `$LOCALAPPDATA` menjadi `$PROGRAMDATA` untuk pembersihan service `UniVPNService`.

## [v0.4.4-desktop] - 2026-10-07

### Added
- **Windows**: Arsitektur background service `UniVPNService` (`LocalSystem`) yang didaftarkan secara otomatis melalui script installer NSIS, memungkinkan manajemen koneksi VPN tanpa pop-up UAC berulang untuk pengguna standar.
- **Desktop**: Dialog pembaruan yang diselaraskan dengan mockup desain: judul kondisional "Pembaruan Siap Dipasang", catatan pembaruan yang dapat digulir (*scrollable release notes*), serta tombol aksi "Nanti Saja" dan "Mulai Ulang Sekarang".

### Fixed
- **Windows**: Memperbaiki error pemuatan library WireGuard `LoadLibraryExW code 126` dengan dynamic probe multi-path (`System32`, direktori executable, bundle resources, dan instalasi sistem `wireguard.exe`).
- **Distribution**: Memisahkan URL unduhan per-platform di `latest.yml` ke tag rilis spesifik (`v*-desktop` dan `v*-mobile`) untuk mencegah kesalahan pengalihan unduhan APK Android.

## [v0.4.3-desktop] - 2026-10-07

### Added
- **macOS**: Mekanisme in-place auto-updater fallback otomatis saat restart pada build bertanda tangan ad-hoc (`identity: '-'`), mengatasi kegagalan senyap Squirrel.Mac / ShipIt.
- **Desktop**: Ikon branding aplikasi resmi multiplatform (`.ico` untuk Windows, `.icns` untuk macOS, dan `.png` untuk Linux/Web).

### Fixed
- **macOS**: Memperbaiki false premature exit detection (`wireguard-go exited prematurely code 0`) saat server membutuhkan waktu respons handshake lebih lama.
- **WireGuard**: Memperpanjang toleransi handshake time window menjadi 10 detik untuk koneksi server dengan latensi lintas negara.
- **Windows**: Menyelaraskan nama file konfigurasi ke `univpn.conf` dan menyempurnakan pelaporan error hak administrator (UAC) pada antarmuka.
- **Distribution**: Memperbarui dan menyinkronkan seluruh manifes rilis multiplatform `latest.yml`, `latest-win.yml`, dan `latest-mac.yml`.

## [v0.4.2-desktop] - 2026-10-07
### Fixed
- **macOS**: Memperbaiki instalasi LaunchDaemon `univpn-helper` agar tidak meminta password administrator berulang-ulang setiap kali koneksi (cukup satu kali autentikasi).
- **macOS**: Menyalin binary pasangan `wireguard-go` dan `wg` ke `/Library/PrivilegedHelperTools/` agar daemon dapat berjalan tanpa dependensi luar.
- **WireGuard**: Memperbaiki format perintah rute host macOS (menghapus argumen `-gateway` yang tidak valid pada BSD `route`) yang sebelumnya menyebabkan route looping dan *handshake timeout*.
- **WireGuard**: Menambahkan verifikasi handshake pasca pembentukan terowongan sebelum menyatakan status terhubung, dengan auto-rollback rute jika server tidak merespons.
- **Desktop**: Memperbaiki penanganan pesan error IPC pada antarmuka pengguna agar menampilkan alasan kegagalan yang akurat alih-alih pesan hardcoded.

## [v0.4.1-desktop] - 2026-10-07

### Fixed
- **Desktop**: Bundle `electron-updater` langsung ke dalam build main process (`electron.vite.config.ts`), mengatasi crash startup `TypeError: Cannot read properties of undefined (reading 'default')` di macOS dan Windows.

### Changed
- **Desktop**: Hapus dependensi `@electron-toolkit/utils` yang tidak terpakai dari `apps/desktop/package.json`.

## [v0.4.0-desktop] - 2026-10-07

### Added
- **Desktop**: Prioritaskan IP server publik untuk endpoint WireGuard dengan fallback otomatis ke domain, mencegah handshake timeout saat subdomain belum dipointing di DNS
- **Desktop**: Sistem pembaruan otomatis (auto-update) menggunakan electron-updater dengan modal dialog interaktif dan manifes multiplatform YAML
- **Desktop**: Dukungan platform macOS lengkap dengan daemon `univpn-helper`, kompilasi universal binary, dan packaging DMG/ZIP
- **Desktop**: Modal Log & Diagnostik dengan penampil status koneksi real-time dan tombol salin log
- **CI**: Workflow build parallel matrix untuk Windows (`.exe`) dan macOS (`.dmg`, `.zip`) dengan checksum SHA256

### Fixed
- **Desktop**: Resolusi ikon bendera negara untuk server Amerika Serikat (US) dan Hong Kong (HK)

## [v0.4.0-mobile] - 2026-10-07

### Added
- **Mobile**: Kepatuhan penuh kebijakan Google Play (Anti-Steering & Payments) dengan transisi ke model akun client-only (existing subscription)

### Changed
- **Mobile**: Penyegaran layar Masuk tanpa tautan pembelian web eksternal
- **Mobile**: Penyederhanaan alur layar Langganan Berakhir dengan opsi langsung Ganti Akun yang aman
- **Mobile**: Dialog pembaruan versi baru pada Mode Lanjutan langsung mengarahkan ke halaman Google Play Store
- **Design**: Pembaruan mock desain (`univpn-v2-final.html`) dan dokumen spesifikasi untuk model client-only

### Fixed
- **Mobile**: Menghapus tombol dan teks steering eksternal pada akun dan pengaturan lanjutan untuk memastikan kepatuhan review Google Play

## [v0.3.0-desktop] - 2026-10-07

### Added
- **Desktop**: Desain UI v2 final selaras penuh dengan spesifikasi dan mobile (Beranda, Lokasi, Pengaturan, Mode lanjutan)
- **Desktop**: Layar Masuk baru dengan animasi peta flat (WelcomeMap) dan form ID Langganan
- **Desktop**: Tombol koneksi bulat 128px bawaan Cyber Shield (Logo Neon) dengan opsi Tema Klasik (Power Icon)
- **Desktop**: Efek animasi koneksi pernapasan (breathing) dan riak ganda (dual ripple) saat terhubung
- **Desktop**: Pemilih lokasi dengan pencarian cepat, latensi milidetik (ms), dan pin bintang server favorit
- **Desktop**: Pengaturan lengkap toggle: Putus otomatis aman (kill switch), Sambung otomatis (auto-connect), dan Buka saat komputer menyala (launch at login)
- **Desktop**: Layar Mode lanjutan untuk pemilihan tema, gaya tombol, dan detail koneksi WireGuard
- **CI**: Dukungan otomatisasi build rilis produksi dan internal untuk platform desktop (.exe) dan mobile

## [v0.3.0] - 2026-10-06

### Added
- **Mobile**: Desain UI v2 final (Beranda, Lokasi, Pengaturan, Akun, Mode lanjutan)
- **Mobile**: Layar Masuk baru dengan animasi peta flat dan layar Izin VPN detail
- **Mobile**: Tombol Cyber Shield neon dengan animasi pernapasan dan indikator radar koneksi
- **Mobile**: Dukungan bendera negara dinamis hybrid (SVG lokal + FlagCDN disk cache)
- **Mobile**: Navigasi responsif untuk tablet

### Changed
- **Mobile**: Penyelarasan antarmuka Masuk dan Izin VPN dengan spesifikasi desain Obsidian v2
- **Mobile**: Detail latensi dalam milidetik (ms) dan kategori kecepatan (Cepat, Normal, Jauh)

### Fixed
- **Mobile**: Perbaikan posisi teks dan formulir pada layar masuk (berada di bagian bawah)
- **Mobile**: Menghapus teks judul redundan pada layar login, menampilkan logo shield mandiri

## [v0.2.0] - 2026-09-22

### Added
- **API**: Configured testing (`https://pfnapp.my.id`) and production (`https://pfnapp.id`) domain settings
- **CI**: Added environment selector (`production` / `testing`) to Android build workflow dispatch
- **Config**: Added `.env.example` templates for mobile and desktop environments

### Changed
- **Mobile**: Dynamic web portal link in settings based on `APP_URL`
- **Shared**: Updated default fallback API and app URLs


## [v0.1.1] - 2026-07-03

### Added
- **Mobile**: Fleet map component with server location visualization
- **Mobile**: Connection stats (bytes up/down, elapsed time) on connection detail screen
- **Mobile**: Filtered profiles logic and new VPN connection state types

### Changed
- **Android**: Enable R8, shrink resources, and PNG crunch for optimized builds
- **Mobile**: Improved connection overlays with shadows in light mode and synced dark mode

### Fixed
- **Android**: Restore transparent PNG assets (removed incorrect JPG conversions)

## [v0.1.0] - 2026-07-02

### Added
- **Mobile**: Dark mode support with persistent theme override (system/light/dark) in settings
- **Mobile**: Redesigned connection detail screen with compact layout and map overlays
- **Mobile**: IP geolocation service to fetch and display user location on FleetMap
- **Mobile**: Theme picker using native modal action sheet
- **Desktop**: Scaffolded electron-vite build pipeline for Windows desktop application
- **Desktop**: Compiled `wg-helper` to executable for production with TS fallback in dev
- **CI**: Added Desktop build and WireGuard DLL update workflows

### Changed
- **Mobile**: Replaced `@expo/ui` Picker with plain rows and action sheet for theme selection
- **Mobile**: Updated map to center and adjust view based on user location with zoom controls

### Fixed
- **Mobile**: Mapped latitude/longitude properly from API response in profile store
- **Mobile**: Center-aligned tab bar icons
- **CI**: Increased Gradle heap to 4.6GB and added `--stacktrace` to fix APK packaging OOM errors

## [v0.0.10] - 2026-07-02

### Added
- App whitelist (split tunnel) for WireGuard VPN — exclude specific apps from VPN tunnel
- Whitelist screen with curated app list, URL paste, and manual add
- Whitelist (Bypass VPN) navigation row in settings
- Whitelisted apps state with add/remove actions in settings store
- Ping indicator on server list cards
- Active filter count badge on filter button
- Selected profile persistence across sessions

### Changed
- Pass whitelisted apps as `excludedApps` when connecting to VPN
- WireGuard split tunnel via `excludeApplication`
- UI refinements across servers and settings screens

## [v0.0.9] - 2026-06-28

### Added
- Rebranded app assets with UniVPN branding
- Reactive server list — renders immediately, pings in background
- Null-safe `PingBadge` component
- FleetMap component with Leaflet OSM on connection detail screen
- Latitude/longitude fields to `VpnProfile` type
- Coordinates to mock server profiles

### Changed
- Server list card clutter removed (WireGuard/port/load)
- Two-phase profile loading — render immediately, ping in background
- `VpnProfile.ping` is now nullable; `formatPing` handles null
- Map takes full card instead of partial
- Server Locations label as floating gray pill
- InfoRow refactored to InfoCell grid
- Removed `@expo/ui` imports and connect button from map screen

### Fixed
- WireGuard port removed from map tooltips
- Duplicate flag removed from status card
- Double loading screen — native splash kept through auth
- FleetMap zoom to active server, bigger dots, country labels

## [v0.0.8] - 2026-06-22

### Added
- VPN permission prompt at first launch instead of at connect time

## [v0.0.7] - 2026-06-19

### Changed
- CI: use secrets for `EXPO_PUBLIC_` environment variables
- CI: add `EXPO_PUBLIC_` env vars for API URLs

### Fixed
- CI: signing replaces all occurrences of debug signing with release (was only replacing first)

## [v0.0.6] - skipped

## [v0.0.5]

### Fixed
- CI: ensure trailing newline in `gradle.properties` before appending signing config

## [v0.0.4]

### Fixed
- CI: fix shell type (bash, not python3) + add missing env block

## [v0.0.3]

### Fixed
- CI: fix release signing setup — use python3 instead of fragile sed

## [v0.0.2]

### Changed
- CI: bump actions to latest (checkout v7, setup-node v6, setup-java v5, upload-artifact v7)
- CI: merge APK & AAB into one Gradle command

### Fixed
- CI: fix track→tracks deprecation

## [v0.0.1]

### Changed
- CI: change trigger from push to release published

---

## Early development (pre-v0.0.1)

The initial application was built across the following areas before the first tag:

### Features
- Initial monorepo setup with apps/mobile, apps/desktop, packages/shared
- VPN type definitions (profile, connection, filter, settings)
- Zustand stores: auth, connection, profile, settings
- Root layout with auth gate and login screen
- NativeTabs layout (Servers, Settings)
- Server list, connection detail, and filter sheet screens
- Real API integration + auth flow + QR scan
- WireGuard VPN connection on Android via local native module
- WireGuard byte counters and statistics from native module
- Connection status polling and error handling
- VPN permission prompt
- FleetMap with Leaflet OSM

### UI / Styling
- Theme colors using Color API from expo-router
- Visual upgrade — brand accent, server cards, connection detail, settings
- Custom SettingsGroup and InfoRow components
- @expo/ui Host boundary fixes for Android compatibility
- Settings layout fixes (SafeAreaView, padding, Switch wrapping)

### Infrastructure
- Expo project scaffolding (SDK 56)
- Self-hosted Android APK build workflow (no EAS)
- Android AAB build + Play Store upload
- Package name: `com.pfnapp.univpn`
- lightningcss pinned to 1.30.1
- ESLint config added

[v0.1.0]: https://github.com/JuniYadi/projects-uni/compare/v0.0.10...v0.1.0
[v0.0.10]: https://github.com/JuniYadi/projects-uni/compare/v0.0.9...v0.0.10
[v0.0.9]: https://github.com/JuniYadi/projects-uni/compare/v0.0.8...v0.0.9
[v0.0.8]: https://github.com/JuniYadi/projects-uni/compare/v0.0.7...v0.0.8
[v0.0.7]: https://github.com/JuniYadi/projects-uni/compare/v0.0.5...v0.0.7
[v0.0.5]: https://github.com/JuniYadi/projects-uni/compare/v0.0.4...v0.0.5
[v0.0.4]: https://github.com/JuniYadi/projects-uni/compare/v0.0.3...v0.0.4
[v0.0.3]: https://github.com/JuniYadi/projects-uni/compare/v0.0.2...v0.0.3
[v0.0.2]: https://github.com/JuniYadi/projects-uni/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/JuniYadi/projects-uni/releases/tag/v0.0.1


