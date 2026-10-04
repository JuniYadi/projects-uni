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
  locations: {
    search: 'Cari lokasi',
    recommended: 'Rekomendasi',
    all: 'Semua lokasi',
    favorites: 'Favorit',
    measuring: 'Mengukur kecepatan…',
    measuringRow: 'mengukur…',
    loadFailed: 'Lokasi tidak bisa dimuat',
    loadFailedHint: 'Periksa internet kamu, lalu coba lagi.',
    empty: 'Lokasi tidak ditemukan',
    emptyHint: 'Coba kata lain atau ubah filter.',
    emptyFavorites: 'Belum ada favorit',
    connect: 'Sambungkan',
    addFavorite: 'Tambah ke favorit',
    removeFavorite: 'Hapus dari favorit',
    filter: 'Filter',
    reset: 'Atur ulang',
    region: 'Wilayah',
    regionAll: 'Semua',
    sort: 'Urutkan',
    sortPing: 'Tercepat',
    sortName: 'Nama',
    show: 'Tampilkan',
    showAll: 'Semua',
    showFavorites: 'Favorit saja',
    mapSummary: 'Lokasi dipilih',
    noneSelected: 'Belum ada lokasi dipilih',
  },
  account: { subscriptionId: 'ID Langganan' },
} as const;

/** ping (ms) → plain-language speed label. Thresholds are a design call; tune here only. */
export function latencyLabel(ms: number | null): string {
  if (ms === null) return Strings.latency.far;
  if (ms < 100) return Strings.latency.fast;
  if (ms < 250) return Strings.latency.normal;
  return Strings.latency.far;
}
