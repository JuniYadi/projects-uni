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
                <span className="grid size-8 place-items-center rounded-lg bg-selected text-xs font-semibold">{countryCode(selected)}</span>
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
                    <span className="grid size-8 place-items-center rounded-lg bg-selected text-xs font-semibold">{countryCode(p)}</span>
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
