# Screen UI Design Documents

Maps the PLANNING.md screen specs to [@expo/ui](https://docs.expo.dev/versions/latest/sdk/ui/) universal components.

## Screens

| # | Screen | File | Status |
|---|--------|------|--------|
| 1 | [Root Layout + Navigation](./01-root-layout.md) | `app/_layout.tsx`, `app/(main)/_layout.tsx` | Design |
| 2 | [Login](./02-login.md) | `app/(auth)/login.tsx` | Design |
| 3 | [Profile List (Servers)](./03-profile-list.md) | `app/(main)/index.tsx` | Design |
| 4 | [Connection Detail](./04-connection-detail.md) | `app/(main)/connection/[id].tsx` | Design |
| 5 | [Settings](./05-settings.md) | `app/(main)/settings/index.tsx` | Design |
| 6 | [Filter Sheet](./06-filter-sheet.md) | `app/(main)/filter/sheet.tsx` | Design |

## Philosophy

- **Universal components first** — satu component tree untuk iOS, Android, web
- **Native feel** — `@expo/ui` render SwiftUI di iOS, Jetpack Compose di Android
- **Minimal dependencies** — cuma tambah zustand, expo-secure-store, expo-crypto
- **File-based routing** — expo-router, route structure udah ditentukan di PLANNING.md
- **Deletion over addition** — pakai komponen yang paling sederhana yang works

## Colors & Theme

Mengikuti `src/constants/theme.ts` yang sudah ada (light/dark mode via `Colors` object).
Tambahan VPN-specific colors akan ditambah di file masing-masing screen.
