# @univpn/design-tokens

Platform-neutral tokens for the Simple/Advanced UniVPN design system. Consumed by
mobile (Expo) via `apps/mobile/src/constants/theme.ts` and by desktop (Electron).
Components are NOT shared: each platform builds its own on top of these tokens.

## Colors (light / dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| text | #000000 | #ffffff | primary text |
| textSecondary | #60646C | #B0B4BA | secondary text, disconnected state |
| background | #ffffff | #000000 | screen |
| backgroundElement | #F0F0F3 | #212225 | cards, sheets |
| backgroundSelected | #E0E1E6 | #2E3135 | selected/pressed |
| border | #D9DADF | #2E3135 | dividers, card outline |
| accent / accentLight / accentDark | #00C781 / #E6FBF4 / #009E68 | #00C781 / #1A3A30 / #00E08E | brand, connect button |
| onAccent | #00261A | #00261A | text/icon on accent |
| success / warning / danger | #00C781 / #B7791F / #D93025 | #00E08E / #F5B942 / #FF6B61 | status |

## Typography

caption 12/16 · body 15/22 · bodyStrong 15/22 (600) · title 20/28 (600) · display 32/40 (700) — size/lineHeight in px.

## Spacing and radius

spacing: half 2, one 4, two 8, three 16, four 24, five 32, six 64. radius: sm 8, md 12, lg 20, pill 999.

## Breakpoints

phone < 600, tablet 600-1023, desktop >= 1024 (`breakpointFor(width)`). `maxContentWidth`: tablet 720, desktop 960.

## Status contract

`statusColor` maps connection state (disconnected / connecting / connected / disconnecting) to a color token.
