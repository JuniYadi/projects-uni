import { useEffect, useState, useMemo } from 'react'
import { Strings } from '../../../../mobile/src/constants/strings'
import type { ProfileInfo, VpnStatus, DesktopSettingsState } from './electron'
import { BrandLogo } from './components/BrandLogo'
import { WelcomeMap } from './components/WelcomeMap'
import { CountryBadge } from './components/CountryBadge'
import { Switch } from './components/Switch'
import {
  IconHome,
  IconLocations,
  IconSettings,
  IconPower,
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconSearch,
  IconKey,
  IconStar,
} from './components/Icons'

type Theme = 'light' | 'dark' | 'system'
type Tab = 'home' | 'locations' | 'settings'

function applyTheme(next: Theme) {
  const isDark =
    next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  document.body.setAttribute('data-theme', isDark ? 'd' : 'l')
}

function getCountryCode(p: ProfileInfo): string {
  if (p.country && p.country.length === 2) return p.country.toUpperCase()
  const name = `${p.country ?? ''} ${p.region} ${p.serverName}`.toUpperCase()
  if (name.includes('INDONESIA') || name.includes('JAKARTA')) return 'ID'
  if (name.includes('SINGAPORE')) return 'SG'
  if (name.includes('HONG KONG')) return 'HK'
  if (name.includes('JAPAN') || name.includes('TOKYO')) return 'JP'
  if (name.includes('UNITED STATES') || name.includes('AMERIKA') || name.includes('DALLAS') || name.includes('LOS ANGELES')) return 'US'
  return (p.country ?? p.region).slice(0, 2).toUpperCase()
}

function getLatencyMs(p: ProfileInfo): number {
  if (p.pingMs && p.pingMs > 0) return p.pingMs
  const c = getCountryCode(p)
  switch (c) {
    case 'ID': return 18
    case 'SG': return 28
    case 'HK': return 74
    case 'JP': return 120
    case 'US': return 210
    default: return 95
  }
}

function getLatencyBadge(ms: number) {
  if (ms < 100) return { label: `Cepat · ${ms} ms`, color: 'text-[#22c55e] dark:text-[#22c55e]' }
  if (ms < 250) return { label: `Normal · ${ms} ms`, color: 'text-[#f59e0b]' }
  return { label: `Jauh · ${ms} ms`, color: 'text-dim' }
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [subId, setSubId] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)

  const [tab, setTab] = useState<Tab>('home')
  const [modeLanjutan, setModeLanjutan] = useState(false)

  // Settings
  const [theme, setTheme] = useState<Theme>('system')
  const [openAtLogin, setOpenAtLogin] = useState(false)
  const [killSwitch, setKillSwitch] = useState(true)
  const [autoConnect, setAutoConnect] = useState(false)
  const [buttonStyle, setButtonStyle] = useState<'cyber' | 'classic'>('cyber')
  const [favorites, setFavorites] = useState<string[]>([])

  // VPN
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<VpnStatus>('disconnected')
  const [connectError, setConnectError] = useState(false)
  const [query, setQuery] = useState('')
  const [showLogModal, setShowLogModal] = useState(false)

  const isDarkTheme =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  async function loadProfiles(preferred?: string | null) {
    const res = await window.electronAPI.getProfiles()
    if (!res.ok) return
    const wgProfiles = res.profiles.filter((p) => p.protocol?.toUpperCase() === 'WIREGUARD')
    setProfiles(wgProfiles)
    setSelectedId((cur) => cur ?? wgProfiles.find((p) => p.id === preferred)?.id ?? wgProfiles[0]?.id ?? null)
  }

  useEffect(() => {
    window.electronAPI
      .getSettings()
      .then(async (s: DesktopSettingsState) => {
        setTheme(s.theme ?? 'system')
        setOpenAtLogin(s.openAtLogin ?? false)
        setKillSwitch(s.killSwitch ?? true)
        setAutoConnect(s.autoConnect ?? false)
        setButtonStyle(s.buttonStyle ?? 'cyber')
        setFavorites(s.favorites ?? [])

        const res = await window.electronAPI.restore()
        if (res.ok) {
          setAuthenticated(true)
          setSubscriptionId(res.subscriptionId)
          await loadProfiles(s.lastProfileId)

          // Auto-connect if enabled and not already connecting/connected
          if (s.autoConnect && s.lastProfileId) {
            void window.electronAPI.connect(s.lastProfileId)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Follow OS color scheme changes while set to "system"
  useEffect(() => {
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [theme])

  // Poll VPN status
  useEffect(() => {
    if (!authenticated) return
    const id = setInterval(async () => {
      const res = await window.electronAPI.status()
      setStatus(res.status)
      if (res.status === 'connected' && res.profileId) {
        setSelectedId(res.profileId)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [authenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subId.trim() || loginBusy) return
    setLoginError(null)
    setLoginBusy(true)
    const res = await window.electronAPI.login(subId.trim())
    if (res.ok) {
      setAuthenticated(true)
      setSubscriptionId(subId.trim())
      await loadProfiles()
    } else {
      setLoginError(res.error ?? 'ID Langganan tidak dikenali. Periksa kembali ID kamu.')
    }
    setLoginBusy(false)
  }

  const handleLogout = async () => {
    if (!confirm('Keluar dari akun UniVPN?')) return
    await window.electronAPI.disconnect()
    await window.electronAPI.logout()
    setAuthenticated(false)
    setSubId('')
    setProfiles([])
    setSelectedId(null)
    setStatus('disconnected')
    setTab('home')
    setModeLanjutan(false)
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


  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    setFavorites(next)
    void window.electronAPI.setSettings({ favorites: next })
  }

  const selected = useMemo(() => profiles.find((p) => p.id === selectedId) ?? profiles[0] ?? null, [profiles, selectedId])

  const sortedProfiles = useMemo(() => {
    const list = profiles.filter((p) =>
      `${p.serverName} ${p.region} ${p.country ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    )
    return list.sort((a, b) => {
      const aFav = favorites.includes(a.id)
      const bFav = favorites.includes(b.id)
      if (aFav && !bFav) return -1
      if (!aFav && bFav) return 1
      return a.serverName.localeCompare(b.serverName)
    })
  }, [profiles, query, favorites])

  if (loading) {
    return (
      <main className="grid h-screen place-items-center bg-bg text-dim">
        <div className="flex flex-col items-center gap-3">
          <div className="spin size-8 rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm font-medium">Memuat…</span>
        </div>
      </main>
    )
  }

  // 1. SCREEN: MASUK (Desktop Login)
  if (!authenticated) {
    return (
      <main className="relative flex h-screen flex-col overflow-hidden bg-bg px-5 pt-4 pb-6 select-none">
        {/* Animated flat dotted map */}
        <div className="flex w-full justify-center pt-2">
          <WelcomeMap />
        </div>

        {/* Form at bottom fading in */}
        <div className="form-fade mt-auto flex flex-col pt-3">
          {/* Logo 44px neon without name */}
          <div className="mb-3 size-11">
            <BrandLogo size={44} variant="neon" isDark={isDarkTheme} />
          </div>

          <h1 className="text-[22px] font-semibold leading-tight text-fg">Selamat datang</h1>
          <p className="mt-0.5 text-sm text-dim">Masuk untuk mulai terlindungi</p>

          <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-2.5">
            <label htmlFor="sub-id" className="text-[13px] font-medium text-fg">
              ID Langganan
            </label>
            <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-line bg-card px-3.5 focus-within:border-accent">
              <IconKey size={20} className="shrink-0 text-dim" />
              <input
                id="sub-id"
                type="text"
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
                placeholder="Tempel ID Langganan kamu"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                className="w-full bg-transparent text-[15px] text-fg placeholder:text-dim focus:outline-none"
              />
            </div>

            <p className="text-xs text-dim">Ada di email atau halaman akun kamu.</p>

            {loginError && <p className="text-xs font-medium text-error">{loginError}</p>}

            <button
              type="submit"
              disabled={!subId.trim() || loginBusy}
              className="mt-2.5 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-[#22C55E] text-[15px] font-semibold text-[#052E16] transition-opacity hover:opacity-95 active:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginBusy ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // Status mapping
  const isFailed = connectError || status === 'error'
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting' || status === 'disconnecting'

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-bg text-fg select-none">
      {/* Scrollable screen body */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        {/* ======================================================== */}
        {/* TAB 1: BERANDA                                           */}
        {/* ======================================================== */}
        {tab === 'home' && (
          <section className="flex h-full flex-col justify-between">
            {/* Top Mini Header: BrandLogo 20px + UniVPN */}
            <header className="flex h-10 items-center gap-2.5">
              <div className="size-5">
                <BrandLogo size={20} variant="neon" isDark={isDarkTheme} />
              </div>
              <span className="text-base font-semibold tracking-tight text-fg">UniVPN</span>
            </header>

            {/* Center Area: Big Button & Status Texts */}
            <div className="my-auto flex flex-col items-center justify-center gap-6 py-6 text-center">
              {/* Big circular button (128px) */}
              <button
                type="button"
                onClick={isConnected ? disconnect : isConnecting ? undefined : connect}
                disabled={!selected || isConnecting}
                aria-label={isConnected ? 'Putuskan VPN' : 'Sambungkan VPN'}
                className={`relative flex size-32 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-not-allowed ${
                  isConnected
                    ? 'btn-connected border-2 border-[#22C55E] bg-card text-[#22C55E]'
                    : isFailed
                      ? 'shake border-2 border-error bg-card text-error shadow-[0_0_0_12px_rgba(239,68,68,0.14)]'
                      : 'border border-line bg-card shadow-sm hover:scale-105'
                }`}
              >
                {/* Rotating arc spinner while connecting */}
                {isConnecting && (
                  <span className="spin absolute -inset-2 rounded-full border-3 border-transparent border-t-[#22C55E]" />
                )}

                {/* Inner Icon: Cyber Shield (Logo Neon) or Classic Power Icon */}
                {buttonStyle === 'cyber' ? (
                  <div className="flex items-center justify-center">
                    <BrandLogo
                      size={isConnected ? 68 : 64}
                      variant={isConnected ? 'neon' : isFailed ? 'idle' : 'neon'}
                      isDark={isDarkTheme}
                    />
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-center ${
                      isConnected ? 'text-[#22C55E]' : isFailed ? 'text-error' : 'text-dim'
                    }`}
                  >
                    <IconPower size={48} />
                  </div>
                )}
              </button>

              {/* Status Titles */}
              <div className="flex flex-col items-center">
                <h1 className="text-xl font-semibold leading-tight text-fg">
                  {isConnected
                    ? Strings.connection.connected.title
                    : isConnecting
                      ? Strings.connection.connecting.title
                      : isFailed
                        ? Strings.connection.failed.title
                        : Strings.connection.idle.title}
                </h1>
                <p className="mt-1.5 text-sm text-dim">
                  {isConnected
                    ? Strings.connection.connected.hint
                    : isConnecting
                      ? Strings.connection.connecting.hint
                      : isFailed
                        ? Strings.connection.failed.hint
                        : Strings.connection.idle.hint}
                </p>
              </div>

              {/* Secondary actions while connecting or failed */}
              {isConnecting && (
                <button
                  type="button"
                  onClick={disconnect}
                  className="rounded-xl border border-line bg-card px-5 py-2 text-sm font-medium text-fg hover:opacity-90 active:opacity-75"
                >
                  {Strings.actions.cancel}
                </button>
              )}

              {isFailed && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={connect}
                    className="rounded-xl bg-[#22C55E] px-5 py-2 text-sm font-semibold text-[#052E16] hover:opacity-90 active:opacity-75"
                  >
                    {Strings.actions.retry}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogModal(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-3.5 py-1 text-xs font-semibold text-error hover:bg-error/20"
                  >
                    <span>Inspeksi log masalah ›</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Location Selector Pill */}
            {selected && (
              <button
                type="button"
                onClick={() => setTab('locations')}
                className="mt-auto flex min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-2.5 text-left transition-colors hover:border-accent/40 active:opacity-80"
              >
                <CountryBadge code={getCountryCode(selected)} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{selected.serverName}</div>
                  <div className="text-xs text-dim">
                    {selected.region} ·{' '}
                    <span className={getLatencyBadge(getLatencyMs(selected)).color}>
                      {getLatencyBadge(getLatencyMs(selected)).label}
                    </span>
                  </div>
                </div>
                <IconChevronRight size={18} className="shrink-0 text-dim" />
              </button>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LOKASI                                            */}
        {/* ======================================================== */}
        {tab === 'locations' && (
          <section className="flex flex-col gap-3.5 pb-2">
            <h1 className="text-xl font-semibold text-fg">{Strings.tabs.locations}</h1>

            {/* Search Input */}
            <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 focus-within:border-accent">
              <IconSearch size={18} className="shrink-0 text-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari lokasi"
                aria-label="Cari lokasi"
                spellCheck={false}
                className="w-full bg-transparent text-sm text-fg placeholder:text-dim focus:outline-none"
              />
            </div>

            {/* Server List */}
            <ul className="flex flex-col gap-2">
              {sortedProfiles.map((p) => {
                const isPicked = p.id === selectedId
                const isFav = favorites.includes(p.id)
                const lat = getLatencyBadge(getLatencyMs(p))
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id)
                        void window.electronAPI.setSettings({ lastProfileId: p.id })
                        setTab('home')
                      }}
                      disabled={isConnected || isConnecting}
                      className={`flex min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-2xl border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isPicked ? 'border-[#22C55E]' : 'border-line'
                      }`}
                    >
                      <CountryBadge code={getCountryCode(p)} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">{p.serverName}</div>
                        <div className="text-xs text-dim">
                          {p.region} · <span className={lat.color}>{lat.label}</span>
                        </div>
                      </div>

                      {/* Favorite button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(p.id, e)}
                        aria-label="Favorit"
                        className="p-1 text-dim hover:text-fg focus:outline-none"
                      >
                        <IconStar size={20} filled={isFav} className={isFav ? 'text-[#22C55E]' : 'text-dim'} />
                      </button>

                      {/* Selected checkmark */}
                      {isPicked && (
                        <span className="shrink-0 text-[#22C55E]">
                          <IconCheck size={20} />
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}

              {sortedProfiles.length === 0 && (
                <li className="py-12 text-center text-sm text-dim">Lokasi tidak ditemukan</li>
              )}
            </ul>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PENGATURAN                                        */}
        {/* ======================================================== */}
        {tab === 'settings' && (
          <section className="flex flex-col gap-4 pb-2">
            {!modeLanjutan ? (
              <>
                <h1 className="text-xl font-semibold text-fg">{Strings.settings.title}</h1>

                {/* Toggles */}
                <div className="flex flex-col gap-2">
                  {/* Putus otomatis aman */}
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3.5">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-fg">{Strings.settings.killSwitch}</div>
                      <div className="text-xs text-dim">{Strings.settings.killSwitchHint}</div>
                    </div>
                    <Switch
                      checked={killSwitch}
                      onChange={(v) => {
                        setKillSwitch(v)
                        void window.electronAPI.setSettings({ killSwitch: v })
                      }}
                      aria-label={Strings.settings.killSwitch}
                    />
                  </div>

                  {/* Sambung otomatis */}
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3.5">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-fg">{Strings.settings.autoConnect}</div>
                      <div className="text-xs text-dim">{Strings.settings.autoConnectHint}</div>
                    </div>
                    <Switch
                      checked={autoConnect}
                      onChange={(v) => {
                        setAutoConnect(v)
                        void window.electronAPI.setSettings({ autoConnect: v })
                      }}
                      aria-label={Strings.settings.autoConnect}
                    />
                  </div>

                  {/* Buka saat komputer menyala */}
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3.5">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-fg">Buka saat komputer menyala</div>
                      <div className="text-xs text-dim">UniVPN berjalan di menu bar / baki sistem</div>
                    </div>
                    <Switch
                      checked={openAtLogin}
                      onChange={(v) => {
                        setOpenAtLogin(v)
                        void window.electronAPI.setSettings({ openAtLogin: v })
                      }}
                      aria-label="Buka saat komputer menyala"
                    />
                  </div>
                </div>
                {/* Log & Diagnostik row */}
                <button
                  type="button"
                  onClick={() => setShowLogModal(true)}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-card p-3.5 text-left transition-colors hover:border-accent/40 active:opacity-80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg">Log & Diagnostik</span>
                      {isFailed && (
                        <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-semibold text-error">
                          1 Gagal
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-dim">Riwayat status & analisis koneksi WireGuard</div>
                  </div>
                  <IconChevronRight size={18} className="text-dim" />
                </button>

                {/* Mode lanjutan row */}
                <button
                  type="button"
                  onClick={() => setModeLanjutan(true)}
                  className="flex items-center justify-between rounded-2xl border border-line bg-card p-3.5 text-left transition-colors hover:border-accent/40"
                >
                  <span className="text-sm font-medium text-fg">{Strings.settings.advanced}</span>
                  <IconChevronRight size={18} className="text-dim" />
                </button>

                {/* Account row */}
                <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-3.5">
                  <span className="text-sm font-medium text-fg">{Strings.account.subscriptionId}</span>
                  <span className="max-w-[55%] truncate text-xs text-dim font-mono">{subscriptionId}</span>
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-2xl border border-line bg-card text-sm font-semibold text-error transition-opacity hover:opacity-80 active:opacity-60"
                >
                  {Strings.actions.logout}
                </button>
              </>
            ) : (
              /* Sub-screen: MODE LANJUTAN */
              <div className="flex flex-col gap-4">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setModeLanjutan(false)}
                  className="-ml-1 flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80"
                >
                  <IconChevronLeft size={18} />
                  <span>Pengaturan</span>
                </button>

                <div>
                  <h1 className="text-xl font-semibold text-fg">{Strings.advanced.buttonStylePick}</h1>
                  <p className="mt-1 text-xs text-dim">{Strings.advanced.hint}</p>
                </div>

                {/* Gaya tombol Beranda */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-dim">
                    {Strings.advanced.buttonStyle}
                  </label>

                  {/* Option 1: Cyber Shield */}
                  <button
                    type="button"
                    onClick={() => {
                      setButtonStyle('cyber')
                      void window.electronAPI.setSettings({ buttonStyle: 'cyber' })
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition-colors ${
                      buttonStyle === 'cyber' ? 'border-[#22C55E]' : 'border-line'
                    }`}
                  >
                    <div className="size-8 shrink-0">
                      <BrandLogo size={32} variant="neon" isDark={isDarkTheme} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-fg">
                        {Strings.advanced.buttonStyleOptions.cyber.label}
                      </div>
                      <div className="text-xs text-dim">
                        {Strings.advanced.buttonStyleOptions.cyber.hint}
                      </div>
                    </div>
                    {buttonStyle === 'cyber' && (
                      <span className="text-[#22C55E]">
                        <IconCheck size={20} />
                      </span>
                    )}
                  </button>

                  {/* Option 2: Tema Klasik */}
                  <button
                    type="button"
                    onClick={() => {
                      setButtonStyle('classic')
                      void window.electronAPI.setSettings({ buttonStyle: 'classic' })
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition-colors ${
                      buttonStyle === 'classic' ? 'border-[#22C55E]' : 'border-line'
                    }`}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#34D874] to-[#16A34A] text-white dark:text-[#052E16]">
                      <IconPower size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-fg">
                        {Strings.advanced.buttonStyleOptions.classic.label}
                      </div>
                      <div className="text-xs text-dim">
                        {Strings.advanced.buttonStyleOptions.classic.hint}
                      </div>
                    </div>
                    {buttonStyle === 'classic' && (
                      <span className="text-[#22C55E]">
                        <IconCheck size={20} />
                      </span>
                    )}
                  </button>
                </div>

                {/* Tema */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-dim">
                    {Strings.advanced.theme}
                  </label>
                  <div className="flex gap-2">
                    {(['system', 'light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTheme(t)
                          void window.electronAPI.setSettings({ theme: t })
                        }}
                        className={`min-h-10 flex-1 cursor-pointer rounded-xl border text-xs font-medium transition-colors ${
                          theme === t
                            ? 'border-[#22C55E] bg-[#22C55E] text-[#052E16] font-semibold'
                            : 'border-line bg-card text-fg'
                        }`}
                      >
                        {Strings.advanced.themeOptions[t].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detail koneksi */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-dim">
                    {Strings.advanced.connectionDetail}
                  </label>
                  <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dim">Status</span>
                      <span className="font-medium text-fg">
                        {isConnected ? 'Terlindungi' : 'Belum terlindungi'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dim">Protokol</span>
                      <span className="font-medium text-fg">WireGuard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dim">Enkripsi</span>
                      <span className="font-medium text-fg">ChaCha20-Poly1305</span>
                    </div>
                    {selected && (
                      <div className="flex justify-between">
                        <span className="text-dim">Server</span>
                        <span className="font-medium text-fg">{selected.serverName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Versi */}
                <div className="flex justify-between px-1 text-xs text-dim">
                  <span>{Strings.advanced.version}</span>
                  <span>1.0.0</span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM TAB BAR (68px)                                    */}
      {/* ======================================================== */}
      <nav
        className="flex h-[68px] shrink-0 border-t border-line bg-card"
        aria-label="Navigasi Utama"
      >
        <button
          type="button"
          onClick={() => {
            setTab('home')
            setModeLanjutan(false)
          }}
          aria-current={tab === 'home' ? 'page' : undefined}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
            tab === 'home' ? 'text-[#22C55E] dark:text-[#22C55E]' : 'text-dim'
          }`}
        >
          <IconHome size={22} />
          <span>{Strings.tabs.home}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('locations')
            setModeLanjutan(false)
          }}
          aria-current={tab === 'locations' ? 'page' : undefined}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
            tab === 'locations' ? 'text-[#22C55E] dark:text-[#22C55E]' : 'text-dim'
          }`}
        >
          <IconLocations size={22} />
          <span>{Strings.tabs.locations}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('settings')}
          aria-current={tab === 'settings' ? 'page' : undefined}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
            tab === 'settings' ? 'text-[#22C55E] dark:text-[#22C55E]' : 'text-dim'
          }`}
        >
          <IconSettings size={22} />
          <span>{Strings.tabs.settings}</span>
        </button>
      </nav>
      {/* Log & Diagnostik Terminal Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-fg">UniVPN · Log & Diagnostik</span>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="cursor-pointer text-sm text-dim hover:text-fg"
              >
                ✕
              </button>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-dim">
              <div>[{new Date().toLocaleTimeString('id-ID')}] [INFO] WireGuard Client Core v1.0.20</div>
              <div>[{new Date().toLocaleTimeString('id-ID')}] [INFO] Server: {selected?.serverName ?? 'Belum ada'} ({selected?.hostname ?? 'N/A'})</div>
              {connectError ? (
                <div className="text-error font-medium">[{new Date().toLocaleTimeString('id-ID')}] [ERROR] Gagal: WireGuard handshake timeout (10 dtk)</div>
              ) : (
                <div className="text-[#22C55E]">[{new Date().toLocaleTimeString('id-ID')}] [OK] Status Terowongan: {status}</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line p-3">
              <button
                type="button"
                onClick={() => {
                  const txt = `UniVPN Desktop Log\nServer: ${selected?.serverName ?? 'N/A'} (${selected?.hostname ?? 'N/A'})\nStatus: ${status}\nError: ${connectError ? 'Handshake timeout' : 'None'}`
                  void navigator.clipboard.writeText(txt)
                  alert('Log disalin ke clipboard!')
                }}
                className="cursor-pointer rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-fg hover:bg-white/5"
              >
                Salin Log
              </button>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="cursor-pointer rounded-xl bg-[#22C55E] px-4 py-1.5 text-xs font-semibold text-[#052E16]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
