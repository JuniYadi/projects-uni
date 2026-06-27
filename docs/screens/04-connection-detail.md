# Connection Detail Screen

**Route:** `app/(main)/connection/[id].tsx`

## Mock

```
┌──────────────────────────────────┐
│  ← Back                          │  ← Stack.Screen header back button
│                                  │
│  ┌──────────────────────────────┐│
│  │          🇸🇬                 ││
│  │       Singapore 1            ││  ← Status card
│  │       WireGuard               ││
│  │                               ││
│  │           🟢                 ││
│  │         CONNECTED            ││  ← Status indicator
│  │                               ││
│  │       00 : 12 : 45           ││  ← Timer (HH:MM:SS)
│  │                               ││
│  │       ▼12.3 MB  ▲5.1 MB     ││  ← Data usage
│  │     Download     Upload       ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │  Server Information          ││
│  │ Server:  sg1.vpn.example.com ││  ← Key-value list
│  │ IP:      203.0.113.10       ││
│  │ Location: Singapore, Asia    ││
│  │ Protocol: WireGuard UDP 51820││
│  │ Encryption: AES-256-GCM     ││
│  │ Connected: 12 min 45 sec     ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │      DISCONNECT              ││  ← Red prominent button
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

## @expo/ui Mapping

| UI Element | Component | Notes |
|-----------|-----------|-------|
| Page root | `Host` + `ScrollView` | `contentInsetAdjustmentBehavior="automatic"` |
| Status card | `Column` + `Text` + emoji | Center aligned, large country emoji |
| Connection status | `Text` + icon | Color: 🟢/🟡/🔴/🟠 |
| Timer | `Text` | Monospace `{ fontVariant: 'tabular-nums' }` — `HH:MM:SS` |
| Data usage row | `Row` + `Text` | Up/down arrows with values |
| Server info list | `Column` of `Row` key-value pairs | Key bold, value normal |
| Disconnect button | `Button` | Destructive variant, full width, red |
| Destructive confirm | `Alert.alert()` | Confirmation dialog before disconnect |

## States

| State | What renders |
|-------|-------------|
| **Loading (profile data)** | Spinner + "Loading server info..." |
| **Disconnected** | 🟠 gray status dot. "DISCONNECTED". Timer paused. Disconnect button hidden. "Connect" button shown. |
| **Connecting** | 🟡 yellow dot + spinner animation. "CONNECTING...". Timer at 00:00:00. |
| **Connected** | 🟢 green dot. "CONNECTED". Timer running. Data usage updating. Disconnect button visible. |
| **Disconnecting** | 🟠 orange dot. "DISCONNECTING...". Button disabled. |
| **Error (connection failed)** | 🔴 red dot. "CONNECTION FAILED". Error message. "Retry" button replaces disconnect. |
| **Destructive confirm** | `Alert.alert("Disconnect", "Are you sure?")` → confirm cancels/dismisses. |

## Behavioral Notes

- Timer update via `useEffect` interval (1 detik) dari connectionStore
- Timer display: `HH:MM:SS` pakai `{ fontVariant: 'tabular-nums' }` supaya angka nggak dance
- Data usage format: auto-scale (B, KB, MB, GB)
- Back button → pop ke profile list. Status koneksi tetap terjaga (tidak disconnect)
- Connection state di Zustand global, jadi detail screen dan profile list sync
- `router.back()` for back, bukan `router.push` ke `/(main)`
- Connect/disconnect via `vpnService.ts` (yang wrap `react-native-wireguard-vpn`)
- Destructive actions pakai `Alert.alert()` confirmation dulu

## ponytail: skipped

- **Data usage chart** — just `Text` numbers. Add `expo-chart-kit`-like view when analytics feature comes.
- **Transfer speed graph** — real-time line graph is Phase 4.
- **Connection ping chart** — `Text` with color badge is enough.
- **Server load sparkline** — same, just `Text`.
