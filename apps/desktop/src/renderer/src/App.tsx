import { useEffect, useState } from 'react'
import { Strings } from '../../../../mobile/src/constants/strings'
import type { ProfileInfo, VpnStatus } from './electron'

type Theme = 'light' | 'dark' | 'system'
type Tab = 'home' | 'locations' | 'settings'

// Desktop-only copy (plain Indonesian, same tone as Strings).
const T = {
  signIn: 'Masuk',
  signInHint: 'Masukkan ID Langganan kamu untuk mulai.',
  loading: 'Memuat…',
  location: 'Lokasi',
  search: 'Cari lokasi',
  empty: 'Lokasi tidak ditemukan',
  theme: 'Tema',
  themes: { system: 'Ikuti sistem', light: 'Terang', dark: 'Gelap' },
  launchAtLogin: 'Buka saat komputer menyala',
  logoutTitle: 'Keluar dari akun?',
}

// Line icons (24px grid), same paths as apps/mobile/src/components/ui/icon.tsx.
const ICON = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  locations: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  power: 'M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0',
} as const

function Icon({ name, size = 24 }: { name: keyof typeof ICON; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON[name]} />
    </svg>
  )
}

const btn = 'min-h-11 rounded-xl px-5 text-[15px] font-semibold transition-opacity active:opacity-70 disabled:opacity-50'
const primary = `${btn} bg-accent text-white dark:text-[#052e16]`
const secondary = `${btn} bg-card text-fg`

function applyTheme(next: Theme) {
  const dark = next === 'dark' || (next === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

const countryCode = (p: ProfileInfo) => (p.country ?? p.region).slice(0, 2).toUpperCase()

function CountryFlag({ code, size = 32 }: { code: string; size?: number }) {
  const upper = code.toUpperCase()
  const ring = 'ring-1 ring-black/10 dark:ring-white/15'

  if (upper === 'ID') {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${ring}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect width="36" height="18" fill="#E11D48" />
          <rect y="18" width="36" height="18" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (upper === 'JP') {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${ring}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" fill="#FFFFFF" />
          <circle cx="18" cy="18" r="7.5" fill="#BC002D" />
        </svg>
      </span>
    )
  }
  if (upper === 'SG') {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${ring}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect width="36" height="18" fill="#E11D48" />
          <rect y="18" width="36" height="18" fill="#FFFFFF" />
          <path d="M 11 3.8 A 5.2 5.2 0 1 0 11 14.2 A 4.3 4.3 0 1 1 11 3.8 Z" fill="#FFFFFF" />
          <polygon points="16.00,5.40 16.27,5.94 16.86,6.03 16.43,6.45 16.53,7.04 16.00,6.76 15.47,7.04 15.57,6.45 15.14,6.03 15.73,5.94" fill="#FFFFFF" />
          <polygon points="18.57,7.27 18.84,7.81 19.43,7.89 19.00,8.32 19.10,8.91 18.57,8.63 18.04,8.91 18.14,8.32 17.71,7.89 18.30,7.81" fill="#FFFFFF" />
          <polygon points="17.59,10.29 17.86,10.82 18.45,10.91 18.02,11.34 18.12,11.93 17.59,11.65 17.06,11.93 17.16,11.34 16.73,10.91 17.32,10.82" fill="#FFFFFF" />
          <polygon points="14.41,10.29 14.68,10.82 15.27,10.91 14.84,11.34 14.94,11.93 14.41,11.65 13.88,11.93 13.98,11.34 13.55,10.91 14.14,10.82" fill="#FFFFFF" />
          <polygon points="13.43,7.27 13.70,7.81 14.29,7.89 13.86,8.32 13.96,8.91 13.43,8.63 12.90,8.91 13.00,8.32 12.57,7.89 13.16,7.81" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (upper === 'HK') {
    const petalWhite = 'M449.964 299.913c-105.263-44.486-58.602-181.581 42.07-174.69-20.366 10.467-23.318 29.997-11.687 48.09 13.024 20.256-1.2 52.848-18.806 60.767-28.935 13.025-34.728 47.75-11.577 65.833z'
    const petalRed = 'M444.272 200.92l-5.92 9.294-2.144-10.815-10.679-2.759 9.625-5.39-.671-10.999 8.085 7.49 10.256-4.043-4.61 10.01 7.001 8.505zm6.288 97.839c-12.731-6.534-22.996-20.155-27.468-36.431-5.115-18.67-2.173-38.743 8.083-55.038l-2.208-1.394c-10.64 16.929-13.693 37.743-8.386 57.12 4.728 17.221 15.214 31.097 28.787 38.064z'
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${ring}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice">
          <rect width="900" height="600" fill="#EE1C25" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 450 300)`}>
              <path d={petalWhite} fill="#fff" />
              <path d={petalRed} fill="#EE1C25" />
            </g>
          ))}
        </svg>
      </span>
    )
  }
  if (upper === 'US') {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-full ${ring}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 36 36">
          <rect width="36" height="36" fill="#FFFFFF" />
          <rect y="0" width="36" height="2.77" fill="#B22234" />
          <rect y="5.54" width="36" height="2.77" fill="#B22234" />
          <rect y="11.08" width="36" height="2.77" fill="#B22234" />
          <rect y="16.62" width="36" height="2.77" fill="#B22234" />
          <rect y="22.15" width="36" height="2.77" fill="#B22234" />
          <rect y="27.69" width="36" height="2.77" fill="#B22234" />
          <rect y="33.23" width="36" height="2.77" fill="#B22234" />
          <rect width="16" height="19.4" fill="#3C3B6E" />
          <circle cx="3.5" cy="3.5" r="0.8" fill="#FFFFFF" />
          <circle cx="8" cy="3.5" r="0.8" fill="#FFFFFF" />
          <circle cx="12.5" cy="3.5" r="0.8" fill="#FFFFFF" />
          <circle cx="5.7" cy="7" r="0.8" fill="#FFFFFF" />
          <circle cx="10.2" cy="7" r="0.8" fill="#FFFFFF" />
          <circle cx="3.5" cy="10.5" r="0.8" fill="#FFFFFF" />
          <circle cx="8" cy="10.5" r="0.8" fill="#FFFFFF" />
          <circle cx="12.5" cy="10.5" r="0.8" fill="#FFFFFF" />
          <circle cx="5.7" cy="14" r="0.8" fill="#FFFFFF" />
          <circle cx="10.2" cy="14" r="0.8" fill="#FFFFFF" />
          <circle cx="3.5" cy="17.5" r="0.8" fill="#FFFFFF" />
          <circle cx="8" cy="17.5" r="0.8" fill="#FFFFFF" />
          <circle cx="12.5" cy="17.5" r="0.8" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }

  return <span className="grid size-8 place-items-center rounded-lg bg-selected text-xs font-semibold">{upper}</span>
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [subId, setSubId] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('home')
  const [theme, setTheme] = useState<Theme>('system')
  const [openAtLogin, setOpenAtLogin] = useState(false)

  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<VpnStatus>('disconnected')
  const [connectError, setConnectError] = useState(false)
  const [query, setQuery] = useState('')

  async function loadProfiles(preferred?: string | null) {
    const res = await window.electronAPI.getProfiles()
    if (!res.ok) return
    setProfiles(res.profiles)
    setSelectedId((cur) => cur ?? res.profiles.find((p) => p.id === preferred)?.id ?? res.profiles[0]?.id ?? null)
  }

  useEffect(() => {
    window.electronAPI
      .getSettings()
      .then(async (s) => {
        setTheme(s.theme ?? 'system')
        setOpenAtLogin(s.openAtLogin)
        const res = await window.electronAPI.restore()
        if (res.ok) {
          setAuthenticated(true)
          setSubscriptionId(res.subscriptionId)
          await loadProfiles(s.lastProfileId)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => applyTheme(theme), [theme])

  // follow the OS theme while set to "system"
  useEffect(() => {
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [theme])

  // status is also changed from the tray, so always poll while signed in
  useEffect(() => {
    if (!authenticated) return
    const id = setInterval(async () => {
      const res = await window.electronAPI.status()
      setStatus(res.status)
      if (res.status === 'connected' && res.profileId) setSelectedId(res.profileId)
    }, 1000)
    return () => clearInterval(id)
  }, [authenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoading(true)
    const res = await window.electronAPI.login(subId.trim())
    if (res.ok) {
      setAuthenticated(true)
      setSubscriptionId(subId.trim())
      await loadProfiles()
    } else {
      setLoginError(res.error ?? 'ID Langganan tidak dikenali')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    if (!confirm(T.logoutTitle)) return
    await window.electronAPI.disconnect()
    await window.electronAPI.logout()
    setAuthenticated(false)
    setSubId('')
    setProfiles([])
    setSelectedId(null)
    setStatus('disconnected')
    setTab('home')
  }

  const connect = async () => {
    if (!selectedId) return
    setConnectError(false)
    setStatus('connecting')
    const res = await window.electronAPI.connect(selectedId)
    if (!res.ok) {
      setConnectError(true)
      setStatus('disconnected')
    }
  }

  const disconnect = async () => {
    setConnectError(false)
    await window.electronAPI.disconnect()
  }

  const saveTheme = (next: Theme) => {
    setTheme(next)
    void window.electronAPI.setSettings({ theme: next })
  }

  const saveOpenAtLogin = (next: boolean) => {
    setOpenAtLogin(next)
    void window.electronAPI.setSettings({ openAtLogin: next })
  }

  if (loading) {
    return <main className="grid h-screen place-items-center text-dim">{T.loading}</main>
  }

  if (!authenticated) {
    return (
      <main className="flex h-screen flex-col justify-center gap-6 px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-[72px] place-items-center rounded-[22px] bg-accent text-white shadow-lg shadow-accent/30 dark:text-[#052e16]">
            <Icon name="power" size={36} />
          </div>
          <h1 className="text-xl font-semibold">{Strings.app.name}</h1>
          <p className="mt-1 text-dim">{T.signInHint}</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-dim" htmlFor="sub">
            {Strings.account.subscriptionId}
          </label>
          <input
            id="sub"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 rounded-xl border border-selected bg-card px-4 text-fg outline-none focus:border-accent"
          />
          {loginError && <p className="text-sm text-error">{loginError}</p>}
          <button type="submit" disabled={!subId.trim()} className={primary}>
            {T.signIn}
          </button>
        </form>
      </main>
    )
  }

  const failed = connectError || status === 'error'
  const view = failed ? 'failed' : status === 'connected' ? 'connected' : status === 'connecting' || status === 'disconnecting' ? 'connecting' : 'idle'
  const copy = Strings.connection[view]
  const selected = profiles.find((p) => p.id === selectedId)
  const shown = profiles.filter((p) => `${p.serverName} ${p.region}`.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <main className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        {tab === 'home' && (
          <section className="flex h-full flex-col items-center justify-center gap-6 pb-8 text-center">
            <button
              onClick={view === 'connected' ? disconnect : view === 'connecting' ? undefined : connect}
              disabled={!selected || view === 'connecting'}
              aria-label={copy.title}
              className={`relative grid size-40 place-items-center rounded-full border-4 transition-colors ${
                view === 'connected'
                  ? 'border-accent bg-accent text-white dark:text-[#052e16]'
                  : view === 'failed'
                    ? 'border-error text-error'
                    : 'border-accent text-accent'
              }`}
            >
              {view === 'connecting' && <span className="spin absolute -inset-2 rounded-full border-4 border-transparent border-t-accent" />}
              <Icon name="power" size={64} />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{copy.title}</h1>
              <p className="mt-1 text-dim">{copy.hint}</p>
            </div>
            {selected && (
              <button onClick={() => setTab('locations')} className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-card px-4 text-left">
                <CountryFlag code={countryCode(selected)} />
                <span className="flex-1 truncate font-medium">{selected.serverName}</span>
                <span className="text-xs text-dim">{T.location}</span>
              </button>
            )}
            {view === 'connecting' && (
              <button onClick={disconnect} className={secondary}>
                {Strings.actions.cancel}
              </button>
            )}
            {view === 'failed' && (
              <button onClick={connect} className={primary}>
                {Strings.actions.retry}
              </button>
            )}
          </section>
        )}

        {tab === 'locations' && (
          <section className="flex flex-col gap-3 pb-4">
            <h1 className="text-xl font-semibold">{Strings.tabs.locations}</h1>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={T.search}
              aria-label={T.search}
              className="min-h-11 rounded-xl border border-selected bg-card px-4 outline-none focus:border-accent"
            />
            <ul className="flex flex-col gap-2">
              {shown.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setSelectedId(p.id)
                      setTab('home')
                    }}
                    disabled={status === 'connected' || status === 'connecting'}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-card px-4 py-2 text-left disabled:opacity-60"
                  >
                    <CountryFlag code={countryCode(p)} />
                    <span className="flex-1">
                      <span className="block font-medium">{p.serverName}</span>
                      <span className="block text-xs text-dim">{p.region}</span>
                    </span>
                    {p.id === selectedId && (
                      <span className="text-accent">
                        <Icon name="check" size={20} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="py-8 text-center text-dim">{T.empty}</li>}
            </ul>
          </section>
        )}

        {tab === 'settings' && (
          <section className="flex flex-col gap-5 pb-4">
            <h1 className="text-xl font-semibold">{Strings.tabs.settings}</h1>

            <div>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-dim">{T.theme}</h2>
              <div className="flex gap-2" role="radiogroup" aria-label={T.theme}>
                {(['system', 'light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    role="radio"
                    aria-checked={theme === t}
                    onClick={() => saveTheme(t)}
                    className={`min-h-11 flex-1 rounded-xl text-sm font-medium ${theme === t ? 'bg-accent text-white dark:text-[#052e16]' : 'bg-card'}`}
                  >
                    {T.themes[t]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-h-11 items-center justify-between rounded-2xl bg-card px-4 py-2">
              <span className="font-medium">{T.launchAtLogin}</span>
              <input
                type="checkbox"
                role="switch"
                checked={openAtLogin}
                onChange={(e) => saveOpenAtLogin(e.target.checked)}
                className="size-5 accent-[var(--accent)]"
              />
            </label>

            <div className="flex min-h-11 items-center justify-between rounded-2xl bg-card px-4 py-2">
              <span className="font-medium">{Strings.account.subscriptionId}</span>
              <span className="max-w-[55%] truncate text-dim">{subscriptionId}</span>
            </div>

            <button onClick={handleLogout} className={`${secondary} text-error`}>
              {Strings.actions.logout}
            </button>
          </section>
        )}
      </div>

      <nav className="flex border-t border-selected bg-card" aria-label="Menu utama">
        {(['home', 'locations', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t ? 'page' : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${tab === t ? 'text-accent' : 'text-dim'}`}
          >
            <Icon name={t} size={22} />
            {Strings.tabs[t]}
          </button>
        ))}
      </nav>
    </main>
  )
}
