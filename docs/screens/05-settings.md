# Settings Screen

**Route:** `app/(main)/settings/index.tsx`

## Mock

```
┌──────────────────────────────────┐
│  ← Back              Settings   │  ← Stack.Screen header
│                                  │
│  CONNECTION                      │  ← FieldGroup section header
│  ┌──────────────────────────────┐│
│  │ Auto-Connect         [OFF]  ││  ← Row: label + Switch
│  │ Kill Switch          [OFF]  ││
│  │ Preferred Protocol   [ Auto]││  ← Row: label + Picker
│  └──────────────────────────────┘│
│                                  │
│  DNS                              │
│  ┌──────────────────────────────┐│
│  │ DNS Server       [Default]  ││  ← Row: label + Picker
│  └──────────────────────────────┘│
│                                  │
│  ACCOUNT                          │
│  ┌──────────────────────────────┐│
│  │ Subscription   SUB-XXXX-XXXX││  ← Row: label + value
│  │ Status         Active       ││
│  │ Expires        2026-12-31   ││
│  │                              ││
│  │ [📋 Manage via Web Portal]  ││  ← Link button
│  │ [🚪 Logout]                ││  ← Destructive button
│  └──────────────────────────────┘│
│                                  │
│  ABOUT                            │
│  ┌──────────────────────────────┐│
│  │ Version           1.0.0     ││
│  │ Build          2026.06.26   ││
│  │                              ││
│  │ [📱 Check for Updates]     ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

## @expo/ui Mapping

| UI Element | Component | Notes |
|-----------|-----------|-------|
| Page root | `Host` + `ScrollView` | `contentInsetAdjustmentBehavior="automatic"` |
| Section | `FieldGroup` | Bordered card for iOS Settings look |
| Rows | `FieldGroup.Item` | Label + trailing control/value |
| Toggle rows | `FieldGroup.Item` + `Switch` | Label left, Switch right |
| Picker rows | `FieldGroup.Item` + `Picker` | Preferred Protocol: Auto/OpenVPN/WireGuard. DNS: Default/Cloudflare/Google/Custom |
| Account info | `FieldGroup` + `Text` | Plain key-value, non-interactive |
| Manage web portal | `Button` (link variant) | Opens `expo-web-browser` |
| Logout | `Button` (destructive) | `Alert.alert` confirmation → clear stores + SecureStore |
| About info | `FieldGroup` + `Text` | Version + build |
| Check updates | `Button` (link) | `expo-updates` check |
| Version label | `Text` | `selectable`, `{ fontVariant: 'tabular-nums' }` |

## States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton shimmer / spinner. Data dari settingsStore + auth store. |
| **Loaded** | All sections visible, controls interactive. |
| **Saving** | Individual switch/picker changes langsung simpan ke SecureStore + zustand. No loading overlay. |
| **Error (save failed)** | Silent fail + console.warn. Settings revert ke previous value. |
| **Logout confirm** | `Alert.alert("Logout", "Are you sure?")`. Confirm → clear all stores + SecureStore → redirect to `/(auth)/login`. |
| **Update available** | "Update available" badge muncul. Tap → start download. |
| **No update** | "You're up to date" toast. |

## Behavioral Notes

- Settings disimpan di **SecureStore** + **Zustand settingsStore** (in-memory cache)
- `Switch` changes langsung persist — no "Save" button needed
- `Picker` changes langsung persist
- Web portal opens via `expo-web-browser.openBrowserAsync(url)` (in-app browser)
- Logout membutuhkan confirmation dialog
- "Check for Updates" pake `expo-updates` API
- Subscription info dari authStore

## ponytail: skipped

- **DNS Custom field** — just string Picker entry "Custom" that reveals TextInput. Add validation UI when DNS custom is common case.
- **Kill Switch detail** — Phase 4 feature. Toggle controls visibility for now.
- **Export/Import config** — not in scope.
