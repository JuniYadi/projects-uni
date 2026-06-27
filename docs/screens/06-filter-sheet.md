# Filter Sheet

**Route:** `app/(main)/filter/sheet.tsx`
**Presentation:** `formSheet` with `sheetAllowedDetents: [0.5, 0.8]`

## Mock

```
┌──────────────────────────────┐  ← grabber visible
│  ┌────────┐                 │
│  │ Filter │   [Reset]       │  ← Title + reset button
│  └────────┘                 │
│                              │
│  Protocol                    │
│  ┌───┐ ┌──────┐ ┌────────┐ │
│  │All│ │OpenVPN│ │WireGuard│ │  ← Chip-style buttons
│  └───┘ └──────┘ └────────┘ │
│                              │
│  Region                      │
│  ┌───┐ ┌──────┐ ┌────────┐ │
│  │All│ │ Asia │ │ Europe │ │
│  └───┘ └──────┘ └────────┘ │
│  ┌───────┐ ┌─────────┐     │
│  │America│ │ Oceania │     │
│  └───────┘ └─────────┘     │
│                              │
│  Connection Status           │
│  ┌───┐ ┌──────────────────┐ │
│  │All│ │Connected (active) │ │
│  └───┘ └──────────────────┘ │
│                              │
│  Sort By                     │
│  ┌────┐ ┌────┐ ┌──────┐   │
│  │Name│ │Ping│ │Region│   │
│  └────┘ └────┘ └──────┘   │
│                              │
│  ┌────────────────────────┐ │
│  │     Apply Filters      │ │  ← Primary CTA
│  └────────────────────────┘ │
└──────────────────────────────┘
```

## @expo/ui Mapping

| UI Element | Component | Notes |
|-----------|-----------|-------|
| Root | `Host` + `Column` | `padding`, scrollable |
| Title + Reset | `Row` + `Text` + `Button`(link) | Reset → clear filter state |
| Section label | `Text` (caption, bold) | "Protocol", "Region", etc. |
| Chip group | `Row` of `Button`(pill) | `variant: selected` vs outline |
| Apply | `Button` (prominent) | Dismiss sheet + apply filter |
| Dismiss | `router.back()` or sheet dismiss | Native swipe down |

## States

| State | Behavior |
|-------|----------|
| **Default** | All options in default state. Reset button enabled only if filter changed. |
| **Selected chips** | Active filter chip has filled background, rest are outline. |
| **Reset** | All chips back to default (All/All/All/Name). Apply → clear filter. |
| **Applied** | Sheet dismiss. Profile list re-renders with filtered data. |
| **No results (from list)** | Profile list shows "No servers match your filters". Filter badge visible. |

## Behavioral Notes

- Filter state di Zustand profileStore (`.activeFilter` + `.setFilter()`)
- Apply sheet dismiss via `router.back()` (otomatis karena formSheet)
- Filter chip: pake `Button` dengan inline style outline vs filled
- Tidak ada "Apply" confirmation loading — synchronous filter di client
- Region + Protocol list berasal dari profile data (dinamis dari API)
- Sort by: client-side sort list dari Zustand

## ponytail: skipped

- **Animated chip selection** — just color change. Add Reanimated layout animation when UX polish demands.
- **Multi-region select** — single select is enough. Multi-select add when user feedback demands.
- **Search within filter** — search already in header. Filter is refine.
