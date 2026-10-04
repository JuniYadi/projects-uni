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
    disconnect: 'Putuskan',
    retry: 'Coba lagi',
    reconnect: 'Sambungkan lagi',
    useWithoutVpn: 'Pakai internet tanpa VPN',
    apply: 'Terapkan',
    logout: 'Keluar',
  },
  home: { noLocation: 'Pilih lokasi dulu', changeLocation: 'Ganti lokasi' },
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
  auth: {
    tagline: 'Internet aman, tanpa ribet',
    idLabel: 'ID Langganan',
    idPlaceholder: 'Masukkan ID Langganan kamu',
    connecting: 'Memeriksa…',
    continue: 'Masuk',
    scanQr: 'Pindai QR',
    getOne: 'Belum punya ID? Beli di website kami',
    idNotFound: 'ID tidak ditemukan. Periksa lagi, ya.',
    network: 'Tidak ada internet. Periksa sambunganmu, lalu coba lagi.',
    generic: 'Belum berhasil masuk. Coba lagi sebentar lagi, ya.',
    qrTitle: 'Pindai QR',
    qrHint: 'Arahkan kamera ke kode QR dari akunmu',
    qrBad: 'QR tidak bisa dipakai. Minta kode baru, atau masukkan ID secara manual.',
    qrChecking: 'Memeriksa…',
    manualId: 'Masukkan ID secara manual',
    cameraNeeded: 'Kamera diperlukan untuk memindai kode QR',
    allowCamera: 'Izinkan kamera',
    back: 'Kembali',
  },
  vpnPermission: {
    title: 'Izinkan UniVPN membuat koneksi aman',
    body: 'Android akan menampilkan satu pertanyaan. Pilih “OK” supaya UniVPN bisa melindungi internet kamu. Ini hanya sekali.',
    allow: 'Lanjut',
  },
  expired: {
    title: 'Langgananmu sudah berakhir',
    body: 'Perpanjang langganan untuk memakai UniVPN lagi, atau masuk dengan akun lain.',
    renew: 'Perpanjang',
    switchAccount: 'Ganti akun',
  },
} as const;

/** Auth API error code → plain-language message for Masuk / Pindai QR. */
export function authErrorText(code: string): string {
  switch (code) {
    case 'SUBSCRIPTION_INVALID':
    case 'NOT_FOUND':
      return Strings.auth.idNotFound;
    case 'PAIRING_TOKEN_USED':
    case 'PAIRING_TOKEN_EXPIRED':
    case 'PAIRING_TOKEN_INVALID':
      return Strings.auth.qrBad;
    case 'NETWORK_ERROR':
      return Strings.auth.network;
    default:
      return Strings.auth.generic;
  }
}

/** ping (ms) → plain-language speed label. Thresholds are a design call; tune here only. */
export function latencyLabel(ms: number | null): string {
  if (ms === null) return Strings.latency.far;
  if (ms < 100) return Strings.latency.fast;
  if (ms < 250) return Strings.latency.normal;
  return Strings.latency.far;
}
