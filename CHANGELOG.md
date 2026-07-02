# Changelog

All notable changes to UniVPN are documented here.


## [v0.1.0] - 2026-07-02

### Added

### Changed

### Fixed

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

[v0.0.10]: https://github.com/JuniYadi/projects-uni/compare/v0.0.9...v0.0.10
[v0.0.9]: https://github.com/JuniYadi/projects-uni/compare/v0.0.8...v0.0.9
[v0.0.8]: https://github.com/JuniYadi/projects-uni/compare/v0.0.7...v0.0.8
[v0.0.7]: https://github.com/JuniYadi/projects-uni/compare/v0.0.5...v0.0.7
[v0.0.5]: https://github.com/JuniYadi/projects-uni/compare/v0.0.4...v0.0.5
[v0.0.4]: https://github.com/JuniYadi/projects-uni/compare/v0.0.3...v0.0.4
[v0.0.3]: https://github.com/JuniYadi/projects-uni/compare/v0.0.2...v0.0.3
[v0.0.2]: https://github.com/JuniYadi/projects-uni/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/JuniYadi/projects-uni/releases/tag/v0.0.1

