# Root Layout + Navigation

## Files

- `app/_layout.tsx` — Root: Host wrapper + providers + auth gate
- `app/(auth)/_layout.tsx` — Auth stack
- `app/(main)/_layout.tsx` — NativeTabs: Servers | Settings
- `app/index.tsx` — Auth check → redirect ke (auth)/login atau (main)

## Route Tree

```
app/
├── _layout.tsx                  # Host, ThemeProvider, AuthProvider
├── index.tsx                    # AuthGate: redirect
├── (auth)/
│   ├── _layout.tsx              # Stack (no header, fullscreen)
│   └── login.tsx
├── (main)/
│   ├── _layout.tsx              # NativeTabs: Servers | Settings
│   ├── index.tsx                # Profile List (Servers home)
│   ├── connection/
│   │   └── [id].tsx             # Connection Detail (push)
│   ├── settings/
│   │   └── index.tsx            # Settings
│   └── filter/
│       └── sheet.tsx            # Filter BottomSheet (formSheet presentation)
└── _error.tsx
```

## Component Mapping

| Element | Component | Notes |
|---------|-----------|-------|
| Root wrapper | `Host` from `@expo/ui` | Wraps seluruh app |
| Theme | `ThemeProvider` from expo-router | Light/dark dari useColorScheme |
| Navigation | `NativeTabs` from `expo-router/unstable-native-tabs` | Bottom tabs: Servers + Settings (plus nanti Desktop sidebar) |
| Auth stack | `Stack` from `expo-router/stack` | No header, gesture disabled |
| Main stack | `Stack` from `expo-router/stack` | Large title, transparent header |
| Modal/sheet | `formSheet` presentation via Stack.Screen | Filter sheet, no custom BottomSheet needed |

## States

### AuthGate (`app/index.tsx`)
- **Loading** — cek SecureStore for saved token → splash/spinner
- **Has token / valid** → redirect ke `/(main)`
- **No token / expired** → redirect ke `/(auth)/login`
- **Error** — SecureStore read error → fallback ke login

### Main Tab Layout
- **Servers tab** — `(main)/index.tsx` (default active)
- **Settings tab** — `(main)/settings/index.tsx`
- **Connected status** — setiap tab perlu tau status koneksi untuk show connected banner

## Behavioral Notes

- `NativeTabs` background color mengikuti theme (Colors.light.background / Colors.dark.background)
- Tab icons: SF Symbols di iOS, Material icons di Android — pakai `NativeTabs.Trigger.Icon` dengan `sf` dan `md` props
- Tab labels: "Servers" dan "Settings"
- Connection detail push via `router.push(`/(main)/connection/${id}`)` dari dalam Servers tab
- Filter modal present via `router.push(`/(main)/filter/sheet`)` dengan `presentation: "formSheet"`

## Per Platform

| Behavior | iOS | Android | Web |
|----------|-----|---------|-----|
| Tab position | Bottom tab bar | Bottom tab bar | Sidebar atau bottom (responsive) |
| Tab style | Native SF Tab Bar | Material Bottom Navigation | CSS tabs |
| Connection push | Push animation | Slide from right | Full page load |
| Filter | Form sheet modal | Bottom sheet modal | Side panel / modal |

> **Skipped:** Tab bar web-specific di Phase 1. Desktop sidebar akan dibangun terpisah.
