# Login Screen

**Route:** `app/(auth)/login.tsx`

## Mock

```
┌──────────────────────────────┐
│           LOGO               │
│         [🛡️ UniVPN]          │
│      Fast & Private          │
│                              │
│  ┌────────────────────────┐  │
│  │ 📷 Scan QR Code        │  │  ← Button, opens camera
│  └────────────────────────┘  │
│                              │
│  ────────── or ──────────    │
│                              │
│  Subscription ID             │
│  ┌────────────────────────┐  │
│  │ Enter your subscription│  │
│  │ ID...                  │  │  ← TextInput (native)
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │      Connect           │  │  ← Primary CTA
│  └────────────────────────┘  │
│                              │
│  ↗️ Get one at our website   │  ← Link
│                              │
│  ─── v1.0.0 ───              │
└──────────────────────────────┘
```

## @expo/ui Mapping

| UI Element | Component | Props |
|-----------|-----------|-------|
| Root layout | `Host` + `Column` | Center aligned, vertical gap |
| Logo | `Text` + `Icon` | Large title font |
| "Scan QR Code" button | `Button` | Variant outline, icon trailiing |
| Sub ID label | `Text` | Caption style |
| Sub ID input | `TextInput` | `useNativeState`, placeholder, paste detection |
| "Connect" button | `Button` | Prominent, full width |
| "Get subscription" link | `Text` + `Button` (link variant) | External link → web |
| Version | `Text` | `selectable`, small, centered |

## States

| State | Behavior |
|-------|----------|
| **Initial** | QR button + sub ID input enabled. Connect button disabled until sub ID filled. |
| **Scanning QR** | Kamera terbuka. Cancel → back. Success → POST /pairing/claim → loading. |
| **Loading (API)** | Connect button → spinner. QR button disabled. Input disabled. |
| **Error — invalid sub** | Red border on input. Error text "Subscription ID tidak valid". Input tetap editable. |
| **Error — QR expired** | Banner "QR code expired. Generate ulang." Dismissable. |
| **Error — network** | Error text "No internet connection". Retry button. |
| **Error — device revoked** | Fullscreen overlay "Device telah di-revoke — hubungi admin". |
| **Success** | Navigate ke `/(main)` — start check animation. |
| **Success (from SecureStore restore)** | Skip login entirely — langsung redirect ke `/(main)`. |

## Behavioral Notes

- TextInput pakai `useNativeState` dari `@expo/ui` — synchronous, flicker-free
- Connect button disabled ketika input kosong
- Paste detection via `onChangeText` — validasi subscription ID format (12 chars alphanumeric)
- QR scan pake `expo-camera` (akan ditambah di implementasi)
- Styling inline, pakai Colors dari `@/constants/theme`
- `ScrollView` dengan `contentInsetAdjustmentBehavior="automatic"` untuk responsiveness
