/** All user-facing UI text (plain Indonesian, no jargon). Screens import from here, never inline. */
export const Strings = {
  app: { name: 'UniVPN' },
  tabs: { home: 'Beranda', locations: 'Lokasi', settings: 'Pengaturan' },
  connection: {
    idle: { title: 'Belum terlindungi', hint: 'Ketuk tombol untuk mulai' },
    connecting: { title: 'Sedang menyambung…', hint: 'Mohon tunggu sebentar' },
    connected: { title: 'Kamu terlindungi', hint: 'Internet kamu aman' },
    failed: { title: 'Tidak bisa tersambung', hint: 'Periksa internet kamu, lalu coba lagi.' },
    dropped: {
      title: 'Koneksi terputus',
      hint: 'Internet dihentikan sementara agar datamu tetap aman.',
    },
  },
  actions: {
    cancel: 'Batal',
    retry: 'Coba lagi',
    reconnect: 'Sambungkan lagi',
    useWithoutVpn: 'Pakai internet tanpa VPN',
    apply: 'Terapkan',
    logout: 'Keluar',
  },
  settings: {
    killSwitch: 'Putus otomatis aman',
    autoConnect: 'Sambung otomatis',
    pickApps: 'Pilih aplikasi',
  },
  latency: { fast: 'Cepat', normal: 'Normal', far: 'Jauh' },
  account: { subscriptionId: 'ID Langganan' },
} as const;

/** ping (ms) → plain-language speed label. Thresholds are a design call; tune here only. */
export function latencyLabel(ms: number | null): string {
  if (ms === null) return Strings.latency.far;
  if (ms < 100) return Strings.latency.fast;
  if (ms < 250) return Strings.latency.normal;
  return Strings.latency.far;
}
