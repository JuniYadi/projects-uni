import { useEffect, useState, useMemo } from 'react'
import { resolveCountryCode, resolveEndpointHost, isIpAddress } from '@univpn/shared'
import { Strings } from '../../../../mobile/src/constants/strings'
import type { ProfileInfo, VpnStatus, DesktopSettingsState, UpdateInfoState } from './electron'
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
  return resolveCountryCode(p)
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
  const [connectError, setConnectError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showLogModal, setShowLogModal] = useState(false)

  // Update System State
  const [updateState, setUpdateState] = useState<UpdateInfoState>({
    currentVersion: '0.4.2',
    status: 'idle',
  })
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [dismissBanner, setDismissBanner] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [installingUpdate, setInstallingUpdate] = useState(false)

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

  // Subscribe to update state
  useEffect(() => {
    window.electronAPI.getUpdateState().then((s) => setUpdateState(s)).catch(() => {})
    const unsub = window.electronAPI.onUpdateStateChanged((next) => {
      setUpdateState(next)
      if (next.status === 'expired' || next.mandatory) {
        setShowUpdateModal(true)
      }
    })
    return unsub
  }, [])

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true)
    try {
      const res = await window.electronAPI.checkForUpdates()
      if (res.state) {
        setUpdateState(res.state)
        if (res.state.availableVersion) {
          setShowUpdateModal(true)
        }
      }
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleApplyUpdate = async () => {
    setInstallingUpdate(true)
    try {
      await window.electronAPI.installUpdate()
    } finally {
      setInstallingUpdate(false)
    }
  }

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

  const isExpired = updateState.status === 'expired'
  const isMandatory = Boolean(updateState.mandatory)
  const isBlocked = isExpired || isMandatory

  const connect = async () => {
    if (isBlocked) {
      setShowUpdateModal(true)
      return
    }
    if (!selectedId) return
    setConnectError(null)
    setStatus('connecting')
    const res = await window.electronAPI.connect(selectedId)
    if (!res.ok) {
      setConnectError(res.error || 'Koneksi gagal')
      setStatus('disconnected')
    }
  }

  const disconnect = async () => {
    setConnectError(null)
    await window.electronAPI.disconnect()
  }


  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    setFavorites(next)
    void window.electronAPI.setSettings({ favorites: next })
  }

  const selected = useMemo(() => profiles.find((p) => p.id === selectedId) ?? profiles[0] ?? null, [profiles, selectedId])
  const activeHost = useMemo(
    () =>
      resolveEndpointHost({
        serverIp: selected?.serverIp,
        hostname: selected?.hostname,
      }),
    [selected]
  )

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
  const isFailed = Boolean(connectError) || status === 'error'
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

            {/* Update Banner: Ready or Available */}
            {(updateState.status === 'ready' || updateState.status === 'available' || updateState.status === 'downloading') && !dismissBanner && (
              <div className="mt-2 mb-1 flex flex-col gap-2 rounded-2xl border border-[#22C55E]/30 bg-gradient-to-br from-[#22C55E]/15 to-[#22C55E]/5 p-3 text-left shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#22C55E] text-[#052E16]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-fg">
                        UniVPN v{updateState.availableVersion || '1.1.0'} {updateState.status === 'ready' ? 'Siap Dipasang' : 'Tersedia'}
                      </span>
                      <span className="rounded bg-[#22C55E] px-1.5 py-0.2 text-[9px] font-bold text-[#052E16]">BARU</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-tight text-dim">
                      {updateState.status === 'ready'
                        ? 'Unduhan selesai di latar belakang. Mulai ulang untuk menerapkan.'
                        : updateState.status === 'downloading'
                          ? `Mengunduh di latar belakang (${updateState.progress || 0}%)…`
                          : 'Pembaruan versi terbaru siap diunduh.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {updateState.status === 'ready' ? (
                    <button
                      type="button"
                      onClick={handleApplyUpdate}
                      disabled={installingUpdate}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#22C55E] py-1.5 text-xs font-bold text-[#052E16] hover:opacity-90 active:scale-98"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      {installingUpdate ? 'Memasang…' : 'Mulai Ulang Sekarang'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(true)}
                      className="flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#22C55E] py-1.5 text-xs font-bold text-[#052E16] hover:opacity-90 active:scale-98"
                    >
                      Lihat Detail & Unduh
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDismissBanner(true)}
                    className="cursor-pointer rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-medium text-dim hover:text-fg"
                  >
                    Nanti
                  </button>
                </div>
              </div>
            )}

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

                {/* Pembaruan Aplikasi card */}
                <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-3.5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg">Versi Aplikasi</span>
                      <span className="rounded-md bg-[#22C55E]/15 px-2 py-0.5 text-[11px] font-bold text-[#22C55E]">
                        v{updateState.currentVersion}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualCheckUpdate}
                      disabled={checkingUpdate || updateState.status === 'downloading'}
                      className="cursor-pointer rounded-lg border border-[#22C55E] bg-transparent px-3 py-1 text-xs font-semibold text-[#22C55E] transition-colors hover:bg-[#22C55E]/10 disabled:opacity-50"
                    >
                      {checkingUpdate ? 'Memeriksa…' : updateState.status === 'ready' ? 'Pasang' : 'Periksa'}
                    </button>
                  </div>
                  <p className="text-xs text-dim">
                    {updateState.status === 'ready'
                      ? `Versi v${updateState.availableVersion} siap dipasang. Mulai ulang aplikasi.`
                      : updateState.status === 'downloading'
                        ? `Sedang mengunduh update v${updateState.availableVersion} (${updateState.progress || 0}%)…`
                        : updateState.status === 'available'
                          ? `Tersedia versi v${updateState.availableVersion}. Siap diunduh.`
                          : updateState.status === 'not-available'
                            ? 'Kamu memakai versi terbaru.'
                            : 'Pengecekan otomatis aktif (tiap 24 jam via GitHub).'}
                  </p>
                </div>

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
                <div className="flex items-center justify-between px-1 text-xs text-dim">
                  <span>{Strings.advanced.version}</span>
                  <div className="flex items-center gap-2">
                    <span>v{updateState.currentVersion}</span>
                    <button
                      type="button"
                      onClick={handleManualCheckUpdate}
                      className="cursor-pointer text-accent hover:underline"
                    >
                      Cek Update
                    </button>
                  </div>
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
              <div>
                [{new Date().toLocaleTimeString('id-ID')}] [INFO] Server: {selected?.serverName ?? 'Belum ada'} ({activeHost || 'N/A'})
                {selected?.hostname && isIpAddress(selected?.serverIp) && selected.serverIp !== selected.hostname ? (
                  <span className="text-dim"> (domain: {selected.hostname})</span>
                ) : null}
              </div>
              {connectError ? (
                <div className="text-error font-medium">[{new Date().toLocaleTimeString('id-ID')}] [ERROR] Gagal: {connectError}</div>
              ) : (
                <div className="text-[#22C55E]">[{new Date().toLocaleTimeString('id-ID')}] [OK] Status Terowongan: {status}</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line p-3">
              <button
                type="button"
                onClick={() => {
                  const txt = `UniVPN Desktop Log\nServer: ${selected?.serverName ?? 'N/A'} (${activeHost || 'N/A'})\nStatus: ${status}\nError: ${connectError ?? 'None'}`
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

      {/* Update Modal: Normal Update, Expired Sunset, or Mandatory Blocking */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-line bg-card p-5 shadow-2xl">
            {/* Header Icon & Tag */}
            <div className="flex items-start justify-between">
              <div
                className={`flex size-11 items-center justify-center rounded-2xl ${
                  isBlocked
                    ? 'border border-error/30 bg-error/15 text-error'
                    : 'border border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]'
                }`}
              >
                {isBlocked ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  isBlocked
                    ? 'bg-error/15 text-error'
                    : 'bg-[#22C55E]/15 text-[#22C55E]'
                }`}
              >
                {updateState.availableVersion ? `v${updateState.availableVersion}` : 'Versi Baru'}
              </span>
            </div>

            {/* Title & Description */}
            <h2 className={`mt-3.5 text-lg font-bold ${isBlocked ? 'text-error' : 'text-fg'}`}>
              {isMandatory
                ? 'Pembaruan Wajib (Kritis)'
                : isExpired
                  ? 'Versi Kedaluwarsa'
                  : 'Pembaruan Tersedia'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-dim">
              {isBlocked
                ? updateState.sunsetMessage || 'Versi Anda sudah tidak didukung demi menjaga keamanan protokol. Perbarui UniVPN untuk melanjutkan koneksi.'
                : 'Versi terbaru UniVPN siap dipasang di komputermu dengan peningkatan kinerja dan stabilitas.'}
            </p>

            {/* Release notes summary */}
            <div className="mt-3.5 flex flex-col gap-1 rounded-xl border border-line bg-black/20 p-3 text-xs leading-relaxed text-dim">
              <span className="font-semibold text-fg">Apa yang baru:</span>
              {updateState.releaseNotes ? (
                <div className="whitespace-pre-line">{updateState.releaseNotes}</div>
              ) : (
                <>
                  <div>• Peningkatan kestabilan protokol WireGuard</div>
                  <div>• Sambung instan saat bangun dari mode tidur/hibernasi</div>
                  <div>• Perbaikan integrasi tray icon sistem</div>
                </>
              )}
            </div>

            {/* Download progress if downloading */}
            {updateState.status === 'downloading' && (
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-dim">Mengunduh di latar belakang…</span>
                  <span className="text-[#22C55E]">{updateState.progress || 0}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-[#22C55E] transition-all"
                    style={{ width: `${updateState.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              {updateState.status === 'ready' ? (
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  disabled={installingUpdate}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#22C55E] py-2.5 text-xs font-bold text-[#052E16] hover:opacity-95 active:scale-98"
                >
                  {installingUpdate ? 'Memasang…' : 'Mulai Ulang Sekarang'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void window.electronAPI.openReleaseUrl()
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#22C55E] py-2.5 text-xs font-bold text-[#052E16] hover:opacity-95 active:scale-98"
                >
                  Unduh Rilis Resmi
                </button>
              )}

              {!isBlocked && (
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="cursor-pointer rounded-xl border border-line bg-card px-4 py-2.5 text-xs font-semibold text-fg hover:bg-white/5"
                >
                  Tutup
                </button>
              )}
            </div>

            {/* Manual download fallback */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  void window.electronAPI.openReleaseUrl()
                }}
                className="cursor-pointer text-[11px] text-dim underline hover:text-fg"
              >
                Kendala unduhan? Unduh manual dari GitHub Releases
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
