# Profile List (Servers Screen)

**Route:** `app/(main)/index.tsx`

## Mock

```
┌──────────────────────────────────┐
│  [🛡️] Servers              [⚙️]  │  ← Large title + settings icon
│                                  │
│  🔍 Search servers...     [Filter]│  ← Search bar + filter pill
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🟢 Connected to Singapore 1 ││  ← ConnectedBanner (conditional)
│  │    00:12:45  ▼12.3 ▲5.1 MB  ││
│  │    [Disconnect]             ││
│  └──────────────────────────────┘│
│                                  │
│  ── RECOMMENDED ────             │
│  ┌──────────────────────────────┐│
│  │ 🇸🇬 Singapore 1  🟢 12ms    ││  ← ProfileCard
│  │ WireGuard/1194·45% load     ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 🇸🇬 Singapore 2  🟢 15ms    ││
│  │ OpenVPN/51820·30% load      ││
│  └──────────────────────────────┘│
│                                  │
│  ── ASIA ───────────             │
│  ┌──────────────────────────────┐│
│  │ 🇯🇵 Tokyo 1      🟡 45ms    ││
│  │ WireGuard/51820·67% load     ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 🇯🇵 Tokyo 2      🔴 80ms    ││
│  │ OpenVPN/1194·80% load        ││
│  └──────────────────────────────┘│
│                                  │
│  ── EUROPE ──────────            │
│  ┌──────────────────────────────┐│
│  │ 🇳🇱 Amsterdam 1  80ms        ││
│  │ WireGuard/51820·120 ms       ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

## @expo/ui Mapping

| UI Element | Component | Notes |
|-----------|-----------|-------|
| Page root | `Host` + `ScrollView` | `contentInsetAdjustmentBehavior="automatic"` |
| Header title | Stack.Screen options | `headerLargeTitle: true`, `title: "Servers"` |
| Search bar | `headerSearchBarOptions` from Stack.Screen | Native search bar (iOS), no custom component |
| Connected banner | `Row` + `Text` + `Button` | Conditional render. Green dot via SF Symbol |
| Section header | `Text` (bold, section) | Region grouping: RECOMMENDED, ASIA, EUROPE |
| Profile card | `Button` (asChild) → `Row` + `Text` + badge | Tap → push `connection/[id]` |
| Ping badge | `Text` with color | 🟢 <50ms, 🟡 50-100ms, 🔴 >100ms |
| Protocol badge | `Text` (monospace, small) | "WireGuard" or "OpenVPN" |
| Filter | `Button` in header trailing | Push to filter/sheet |
| Refresh | `PullToRefresh` (mobile) | iOS native refresh control |
| Loading | `Text` "Loading servers..." | Centered, with spinner |
| Empty | `Text` "No servers found" | With retry button |
| Error | `Text` error message | With retry button |

## Behavior

- **Connected server diatas** — server yang sedang aktif muncul sebagai banner di bagian paling atas. Bisa tap → push connection detail.
- **Tap profile card** → `router.push('/(main)/connection/' + profile.id)`
- **Long press profile card** → context menu (Link.Menu) — Connect / Copy config
- **Search** → native header search bar, filter list by name
- **Filter** → push `/(main)/filter/sheet` as formSheet modal
- **Pull-to-refresh** → reload profiles dari API
- **Data** — dari Zustand profileStore, yang fetch dari GET /profiles

## States

| State | What renders |
|-------|-------------|
| **Loading** | Full screen spinner + "Loading servers..." |
| **Loaded (empty)** | Empty state illustration + "No servers found" + Refresh button |
| **Loaded (data)** | Sectioned list of ProfileCards |
| **Connected** | ConnectedBanner at top + connected server highlighted |
| **Connecting** | ConnectedBanner shows "Connecting..." with spinner |
| **Error (API)** | Error message + "Tap to retry" button |
| **Error (refreshing)** | Existing list stays visible, refresh spinner at top |
| **Searching** | Filtered list, "No results" if empty |

## ponytail: skipped

- **Ping animation** — `Text` is enough. Add `Reanimated` ping pulse when connection UX demands it.
- **Real-time data usage polling** — just update on heartbeat response. Push-based WebSocket add when < 1s latency matters.
- **Desktop sidebar** — separate component tree, add when electron app starts.
