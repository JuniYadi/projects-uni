# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UniVPN — multi-platform VPN client. Monorepo with a mobile app (Expo SDK 56) and shared packages.

## Commands

```sh
# Work from the mobile app directory
cd apps/mobile

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

No test infrastructure exists — no test runner configured.

## Architecture

### Monorepo (`bun workspaces` in root `package.json`)

```
<root>/
  apps/
    mobile/          ← Expo SDK 56 app (iOS + Android + web)
    desktop/         ← Electron shell (scaffold only, sparse)
    mobile-old/      ← Archive, not in use
  packages/
    shared/          ← @univpn/shared: types, enums, validation (zod), utils (formatters)
  docs/
    screens/         ← Design references
  screenshots/
```

### Mobile app structure (Expo Router — file-based under `src/app/`)

```
src/app/
  _layout.tsx        <Host> + ThemeProvider + Stack (index, auth, main, error)
  index.tsx          AuthGate — checks authStore, redirects to login or /servers
  _error.tsx         Fallback error screen
  (auth)/
    _layout.tsx      Stack with gesture disabled
    login.tsx        Subscription ID login + QR placeholder
  (main)/
    _layout.tsx      NativeTabs: Servers + Settings
    servers/
      _layout.tsx    Stack (headerLargeTitle, search bar, filter formSheet)
      index.tsx      Server list with pull-to-refresh, sections, ping badges
      connection/[id].tsx  Connection detail, connect/disconnect, stats
      filter/sheet.tsx     Filter form (protocol, region, status, sort)
    settings/
      index.tsx      Settings screen (toggles, protocol/DNS pickers, account, actions)
```

### State (Zustand stores in `src/stores/`)

| Store | Key state | Persistence |
|-------|-----------|------------|
| `authStore` | subscriptionId, token, status (idle/loading/valid/invalid/expired) | `expo-secure-store` |
| `connectionStore` | profile, status, startTime, elapsed, bytes up/down | None (ephemeral) |
| `profileStore` | profiles[], filteredProfiles[], activeFilter, regions | None (fetched) |
| `settingsStore` | autoConnect, killSwitch, preferredProtocol, dnsServer | `expo-secure-store` (JSON) |

All stores currently use mock/placeholder data — no real API calls. Real API endpoints are stubbed.

### Shared package (`packages/shared/`)

Types, enums, zod validation, and utilities shared between mobile and desktop:
- `src/types/` — `vpn.ts`, `connection.ts`, `subscription.ts`, `api.ts`
- `src/enums/` — `protocol.ts`, `status.ts`
- `src/validation/` — `subscription.ts`, `config.ts` (zod schemas)
- `src/constants/` — `api.ts` (endpoint URLs, timeouts)
- `src/utils/` — `formatters.ts`

### Key UI & styling patterns

- **Components**: `@expo/ui` (`Host`, `Button`, `Switch`, `Picker`, `FieldGroup`, `TextInput`) for native SwiftUI/Compose rendering. `Host` wraps native components and is required around `@expo/ui` components.
- **Styles**: Tailwind v4 via NativeWind v5 (`className="..."`), `clsx` for conditionals, `tailwind-merge` for dedup. CSS in `src/global.css` imports Tailwind layers + `nativewind/theme` + custom font vars.
- **Theme**: `src/constants/theme.ts` (light/dark Colors, Fonts, Spacing) and `src/theme/colors.ts` (Expo Router `Color.ios.*` / `Color.android.*` platform colors).
- **Platform files**: `.web.tsx` variants for web where native APIs differ (`animated-icon`, `app-tabs`, `use-color-scheme`).
- **Navigation**: `NativeTabs` for main tabs. `formSheet` (0.5/0.85 detents) for filter sheet. Native `headerSearchBarOptions` for search.
- **Auth**: `expo-secure-store` for token persistence. Dev bypass via `EXPO_PUBLIC_SKIP_AUTH=1` in `.env`.

### Important gotchas

- **SDK 56**: Expo SDK 56. Always check [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) — API changes between SDK versions.
- **`@expo/ui`**: Native SwiftUI/Compose components (`Host`, `Column`, `Row`, `Button`, `List`, `Switch`, `Picker`, `FieldGroup`, `TextInput`). Prefer these over community RN components. `Host` with `matchContents` is needed for proper sizing of `Switch` and `Picker` inside flex layouts.
- **`lightningcss` pinned**: Pinned to `1.30.1` in root `package.json` overrides — bundling breaks on newer versions.
- **React Compiler**: Enabled via `experiments.reactCompiler: true` in app.json. Code must be compiler-safe (no stale closures).
- **Native prebuilds**: `/ios` and `/android` are gitignored — run `npm run ios`/`npm run android` to generate them.
- **Worktree-based development** preferred for feature work (isolates native builds).
- **Ponytail mode**: Codebase uses `ponytail:` comments for deliberate simplifications (mock data, placeholder APIs, deferred features). Don't fill these in unless explicitly asked.

## Available skills & MCP tools

Invoke these via `/skill-name` or `Skill` tool when relevant:

### Expo skills (critical — use BEFORE writing Expo/RN code)

| Skill | When to use |
|-------|-------------|
| `expo:expo-ui` | **@expo/ui** — building native UI with Host, Button, Switch, Picker, FieldGroup, List, etc. Covers universal & platform-specific components. Use BEFORE writing any `@expo/ui` code. |
| `expo:building-native-ui` | Building beautiful apps with Expo Router — styling, navigation, animations, native tabs. |
| `expo:native-data-fetching` | Implementing/debugging ANY network request, API call, data fetching — fetch API, React Query, caching, offline. |
| `expo:expo-tailwind-setup` | Tailwind CSS v4 setup with react-native-css and NativeWind v5. |
| `expo:expo-api-routes` | Creating API routes in Expo Router with EAS Hosting. |
| `expo:expo-module` | Creating native modules with Expo Modules API (Swift/Kotlin). |
| `expo:expo-dev-client` | Building/distributing dev clients via TestFlight. |
| `expo:expo-deployment` | Build & submit to App Store / Play Store, eas.json profiles, versioning. |
| `expo:expo-cicd-workflows` | Writing EAS workflow YAML files (.eas/workflows/). |
| `expo:upgrading-expo` | Upgrading Expo SDK versions and fixing dependency issues. |
| `expo:expo-examples` | Official `with-*` example projects (Stripe, Clerk, Supabase, etc.). |
| `expo:use-dom` | Using Expo DOM components (web code in a webview on native). |
| `expo:expo-observe` | EAS Observe — app metrics, TTR, TTI, route tracking. |
| `expo:eas-update-insights` | EAS Update health — crash rates, install counts, distribution. |
| `expo:expo-brownfield` | Embedding Expo in existing native apps. |
| `expo:add-app-clip` | Adding iOS App Clip targets. |

### Other skills

| Skill | When to use |
|-------|-------------|
| `code-review` | Review current diff for correctness bugs + cleanups. |
| `superpowers:systematic-debugging` | Any bug, test failure, or unexpected behavior BEFORE proposing fixes. |
| `superpowers:brainstorming` | Before any creative work — features, components, new functionality. |
| `superpowers:writing-plans` | Before multi-step tasks, after getting requirements. |
| `superpowers:verification-before-completion` | Before claiming work is complete — run verification commands first. |
| `verify` | Run the app and observe a change working. |
| `security-review` | Security review of pending changes. |
| `ponytail:ponytail` | Forces laziest solution — YAGNI, stdlib, native, one line. |

### MCP tools (available via tool calls)

| Tool server | What it does |
|-------------|-------------|
| `context7` | Fetch current docs for any library/framework/SDK. ALWAYS use before writing code against an unfamiliar API. |
| `shacdn` | Get shadcn/ui v4 components, blocks, themes source code. |
| `playwright` | Browser automation — navigate, click, screenshot, snapshot (for web testing). |
| `expo` (plugin) | Manage EAS builds, workflows, app store reviews, TestFlight feedback, crash data. |
