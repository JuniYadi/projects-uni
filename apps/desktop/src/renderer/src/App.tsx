import { useEffect, useState } from 'react'
import type { ProfileInfo, SubscriptionInfo, VpnStats, VpnStatus } from './electron'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)

  const [subId, setSubId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [screen, setScreen] = useState<'dashboard' | 'settings'>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  const [status, setStatus] = useState<VpnStatus>('disconnected')
  const [stats, setStats] = useState<VpnStats | null>(null)
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI
      .getSettings()
      .then((s) => setTheme(s.theme ?? 'system'))
      .catch(() => {})

    window.electronAPI
      .restore()
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true)
          loadProfiles()
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!authenticated || screen !== 'dashboard') return
    const id = setInterval(async () => {
      const res = await window.electronAPI.status()
      setStatus(res.status)
      setStats(res.stats)
      setCurrentProfileId(res.profileId)
    }, 1000)
    return () => clearInterval(id)
  }, [authenticated, screen])

  function applyTheme(next: 'light' | 'dark' | 'system') {
    const isDark =
      next === 'dark' ||
      (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  async function loadProfiles() {
    const res = await window.electronAPI.getProfiles()
    if (res.ok) setProfiles(res.profiles)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await window.electronAPI.login(subId.trim())
    setLoading(false)
    if (res.ok) {
      setAuthenticated(true)
      setSubscription(res.subscription)
      await loadProfiles()
    } else {
      setError(res.error ?? 'Login gagal')
    }
  }

  const handleLogout = async () => {
    await window.electronAPI.logout()
    setAuthenticated(false)
    setSubId('')
    setProfiles([])
    setStatus('disconnected')
    setCurrentProfileId(null)
  }

  const handleConnect = async (profileId: string) => {
    setError(null)
    const res = await window.electronAPI.connect(profileId)
    if (!res.ok) setError(res.error ?? 'Gagal connect')
  }

  const handleDisconnect = async () => {
    const res = await window.electronAPI.disconnect()
    if (!res.ok) setError(res.error ?? 'Gagal disconnect')
  }

  const setThemeAndSave = async (next: 'light' | 'dark' | 'system') => {
    setTheme(next)
    await window.electronAPI.setSettings({ theme: next })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <p>Memuat…</p>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <h1 className="text-3xl font-bold">UniVPN Desktop</h1>
        <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
          <input
            type="text"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            placeholder="Subscription ID"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={!subId || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Login
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">UniVPN</h1>
        <nav className="flex gap-4">
          <button
            onClick={() => setScreen('dashboard')}
            className={screen === 'dashboard' ? 'font-medium text-blue-600' : 'text-zinc-500'}
          >
            Dashboard
          </button>
          <button
            onClick={() => setScreen('settings')}
            className={screen === 'settings' ? 'font-medium text-blue-600' : 'text-zinc-500'}
          >
            Settings
          </button>
        </nav>
      </header>

      {screen === 'dashboard' && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Status</p>
            <p className="text-2xl font-semibold capitalize">{status}</p>
            {stats && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                ↑ {formatBytes(stats.bytesSent)} ↓ {formatBytes(stats.bytesReceived)}
              </p>
            )}
          </div>

          {profiles.length > 0 && (
            <div className="w-full max-w-sm">
              <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Server</p>
              <select
                value={currentProfileId ?? profiles[0].id}
                onChange={(e) => setCurrentProfileId(e.target.value)}
                disabled={status === 'connected' || status === 'connecting'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.serverName} ({p.region})
                  </option>
                ))}
              </select>
            </div>
          )}

          {status === 'connected' || status === 'connecting' ? (
            <button
              onClick={handleDisconnect}
              className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-500"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnect(currentProfileId ?? profiles[0]?.id)}
              disabled={profiles.length === 0}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Connect
            </button>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </section>
      )}

      {screen === 'settings' && (
        <section className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Tampilan</h2>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setThemeAndSave(t)}
                  className={`rounded-lg border px-4 py-2 capitalize ${
                    theme === t
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Akun</h2>
            {subscription && (
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                Subscription: {subscription.status}
              </p>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-zinc-200 px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Logout
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
