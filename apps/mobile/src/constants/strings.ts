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
    title: 'Pengaturan',
    killSwitch: 'Putus otomatis aman',
    killSwitchHint: 'Internet berhenti jika VPN terputus',
    autoConnect: 'Sambung otomatis',
    autoConnectHint: 'Langsung aman saat buka internet',
    pickApps: 'Pilih aplikasi',
    pickAppsHint: 'Hanya aplikasi tertentu yang pakai VPN',
    advanced: 'Mode lanjutan',
    manageWeb: 'Kelola akun di situs web',
  },
  apps: {
    intro: 'Aplikasi di bawah ini tidak lewat VPN. Cocok untuk aplikasi bank atau yang menolak VPN.',
    add: 'Tambah aplikasi',
    empty: 'Belum ada aplikasi.',
    androidOnly: 'Fitur ini hanya ada di Android.',
    remove: 'Hapus',
    fromLink: 'Tempel tautan Play Store',
    fromLinkAction: 'Tambah dari tautan',
    or: 'atau',
    packageName: 'Nama paket aplikasi',
    packageHint: 'Untuk pengguna berpengalaman.',
    linkInvalid: 'Tautan tidak dikenali. Salin tautan dari Play Store, lalu tempel di sini.',
    packageInvalid: 'Nama paket tidak valid. Contoh: com.contoh.aplikasi',
    already: 'Aplikasi ini sudah ada di daftar.',
  },
  advanced: {
    hint: 'Untuk pengguna berpengalaman. Jika ragu, biarkan seperti sekarang.',
    dns: 'Server DNS',
    dnsHint: 'Memengaruhi cara situs dicari. Biarkan Otomatis jika ragu.',
    dnsPick: 'Pilih DNS',
    dnsOptions: {
      default: { label: 'Otomatis', hint: 'Disarankan' },
      cloudflare: { label: 'Cloudflare', hint: 'Cepat dan privat' },
      google: { label: 'Google', hint: 'Stabil' },
      adguard: { label: 'AdGuard', hint: 'Blokir iklan' },
    },
    theme: 'Tema',
    themePick: 'Pilih tema',
    themeOptions: {
      system: { label: 'Ikuti sistem', hint: 'Sesuai pengaturan HP/komputer' },
      light: { label: 'Terang', hint: '' },
      dark: { label: 'Gelap', hint: '' },
    },
    connectionDetail: 'Lihat detail koneksi',
    checkUpdate: 'Cek pembaruan',
    autoUpdate: 'Pembaruan otomatis',
    autoUpdateHint: 'Beri tahu jika ada versi baru',
    version: 'Versi',
    upToDate: 'Sudah terbaru',
    upToDateMsg: (v: string) => `Kamu memakai versi terbaru (${v}).`,
    newVersion: 'Ada versi baru',
    newVersionMsg: (v: string) => `Versi ${v} siap diperbarui.`,
    later: 'Nanti',
    update: 'Perbarui',
    ok: 'OK',
  },
  detail: {
    title: 'Detail koneksi',
    current: 'Koneksi saat ini',
    status: 'Status',
    protected: 'Terlindungi',
    notProtected: 'Belum terlindungi',
    location: 'Lokasi',
    ip: 'Alamat IP kamu',
    network: 'Jaringan',
    server: 'Server',
    serverAddress: 'Alamat server',
    dns: 'DNS',
    empty: 'Belum tersambung. Sambungkan VPN dari Beranda untuk melihat detailnya.',
    wifi: 'Wi-Fi',
    cellular: 'Data seluler',
    unknown: 'Tidak diketahui',
  },
  error: {
    title: 'Ada yang tidak beres',
    message: 'Maaf, aplikasi mengalami masalah. Coba mulai ulang.',
    home: 'Kembali ke Beranda',
  },
  latency: { fast: 'Cepat', normal: 'Normal', far: 'Jauh' },
  account: {
    title: 'Akun',
    subscriptionId: 'ID Langganan',
    subscription: 'Langganan',
    active: 'Aktif',
    expired: 'Berakhir',
    unknown: 'Tidak diketahui',
    validUntil: 'Berlaku sampai',
    devices: 'Perangkat',
    devicesCount: (n: number) => `${n} aktif`,
    logoutTitle: 'Keluar dari akun?',
    logoutMessage: 'Kamu perlu ID Langganan atau QR untuk masuk lagi.',
    expiredTitle: 'Langganan berakhir',
    expiredMessage: 'Perpanjang untuk kembali terlindungi. Datamu tetap aman di akunmu.',
    renew: 'Perpanjang langganan',
    switchAccount: 'Ganti akun',
  },
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
