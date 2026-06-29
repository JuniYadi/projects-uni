# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UniVPN — Expo SDK 56 app for iOS/Android (VPN client). Built with `@expo/ui` (native SwiftUI/Compose components), Expo Router (file-based navigation), NativeWind v5 + Tailwind v4 for styling, Zustand for state.

## Commands

```sh
# Start dev server
npm start

# Run on device/emulator (prebuilds native projects)
npm run ios
npm run android

# Run in web browser
npm run web

# Lint (expo lint)
npm run lint
```

No test infrastructure exists — there are no test files or test runner configured.

## Architecture

### Monorepo (`bun workspaces`)
```
<repo-root>/
  apps/mobile/    ← this app
  packages/
  docs/
```

### Routing (Expo Router — file-based under `src/app/`)

```
src/app/
  _layout.tsx        <Host> + ThemeProvider + Stack (index, auth, main, error)
  index.tsx          Auth gate — checks authStore, redirects to /(auth)/login or /(main)/servers
  _error.tsx         Fallback error screen
  (auth)/
    _layout.tsx
    login.tsx        Subscription ID login, QR placeholder
  (main)/
    _layout.tsx      NativeTabs: Servers + Settings
    servers/
      _layout.tsx    Stack with search bar, filter formSheet
      index.tsx      Server list, pull-to-refresh
      connection/[id].tsx  Connection detail, connect/disconnect, stats
      filter/sheet.tsx     Filter form (protocol, region, status, sort)
    settings/
      index.tsx      Settings (toggles, protocol/DNS pickers, account, actions)
```

### State (Zustand stores in `src/stores/`)

| Store | Key state |
|-------|-----------|
| `authStore` | subscriptionId, token, status (idle/loading/valid/invalid/expired) |
| `connectionStore` | profile, status, startTime, elapsed, bytes up/down |
| `profileStore` | profiles[], filteredProfiles[], activeFilter, filters/loads mock data |
| `settingsStore` | autoConnect, killSwitch, preferredProtocol, dnsServer, persisted to expo-secure-store |

All stores currently use mock/placeholder data — no real API calls.

### Key patterns

- **Styles**: Tailwind v4 classes via NativeWind, plus `clsx` for conditional classes, `tailwind-merge` for deduplication. CSS in `src/global.css`.
- **Platform files**: `.web.tsx` variants for web-specific component implementations (`animated-icon`, `app-tabs`, `use-color-scheme`).
- **Auth**: `expo-secure-store` for token persistence. Dev bypass via `EXPO_PUBLIC_SKIP_AUTH=1` env var.
- **Navigation**: Expo Router `NativeTabs` for main tabs, `formSheet` presentation for filter sheet (0.5/0.85 detents).
- **VPN types** in `src/types/vpn.ts`: `VpnProfile`, `ConnectionInfo`, `FilterState`, `AppSettings`, `VpnProtocol`, `ConnectionStatus`.
- **Theme** in `src/constants/theme.ts` and `src/theme/colors.ts`.

### Important gotchas

- Always reference [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) before writing code — API surface changes between SDK versions.
- This SDK ships `@expo/ui` (native SwiftUI/Compose rendering via `Host`, `Column`, `Row`, `Button`, `List`, etc.) — prefer these over community RN components where applicable.
- `lightningcss` is pinned to `1.30.1` in root `package.json` overrides — bundling breaks on newer versions.
- `react-compiler` is enabled via `experiments.reactCompiler: true` in app.json.
- Native prebuild outputs (`/ios`, `/android`) are gitignored — run `npm run ios` or `npm run android` to generate them.
- Worktree-based development is preferred for feature work (isolates native builds).
