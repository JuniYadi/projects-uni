# UniVPN

Multi-platform VPN client berbasis WireGuard untuk **Android**, **macOS**, dan **Windows**.

Repository ini adalah monorepo (`bun workspaces`) yang menampung aplikasi mobile (Expo SDK 56) dan aplikasi desktop (Electron + Vite + React).

---

## 📥 Panduan Instalasi & Catatan Keamanan

Karena installer desktop (macOS & Windows) pra-rilis ini belum menggunakan sertifikat berbayar Apple Developer ID ($99/thn) dan Microsoft Authenticode, sistem operasi akan menampilkan dialog proteksi keamanan bawaan saat pertama kali dibuka.

### macOS (Apple Silicon & Intel)

Saat membuka file `UniVPN.app` dari `.dmg` atau `.zip`, macOS Gatekeeper mungkin menampilkan pesan:
> *"Apple could not verify “UniVPN.app” is free of malware that may harm your Mac or compromise your privacy."*  
> atau *"“UniVPN.app” was blocked from use because it is not from an identified developer."*

**Cara membukanya (cukup sekali):**

1. **Lewat System Settings (Rekomendasi UI):**
   * Klik **Done** atau **Cancel** pada jendela peringatan.
   * Buka **System Settings** → **Privacy & Security**.
   * Scroll ke bawah ke bagian **Security**.
   * Di bawah teks *"UniVPN.app was blocked..."*, klik tombol **Open Anyway** (Buka Saja).
   * Masukkan password atau Touch ID Mac kamu, lalu klik **Open**.

2. **Lewat Klik Kanan di Finder:**
   * Tahan tombol **Control** lalu klik (atau **Klik Kanan**) pada `UniVPN.app` di Finder.
   * Pilih menu **Open**.
   * Pada jendela konfirmasi yang muncul, klik tombol **Open**.

3. **Lewat Terminal (Sekali Perintah Tanpa Dialog):**
   ```bash
   xattr -cr /Applications/UniVPN.app
   ```
   *(atau arahkan ke path `.app` tempat kamu menyimpan file).*

---

### Windows (10 / 11)

Saat menjalankan file installer `UniVPN-Setup-*.exe` atau versi Portable, Windows SmartScreen mungkin menampilkan:
> *"Windows protected your PC"* / *"Windows melindungi PC Anda"*

**Cara menjalankannya:**
1. Klik tautan **More info** (*Informasi selengkapnya*).
2. Klik tombol **Run anyway** (*Tetap jalankan*).

---

### Android

* File build internal dan produksi otomatis diunggah ke Google Play Console track Internal/Alpha.
* Paket `.aab` dan referensi rilis dapat dilihat pada halaman [GitHub Releases](https://github.com/JuniYadi/projects-uni/releases).

---

## 🏗️ Struktur Proyek

```text
projects-uni/
├── apps/
│   ├── mobile/         # Aplikasi Android/iOS (Expo SDK 56, Expo Router, NativeWind v5)
│   └── desktop/        # Aplikasi Desktop (Electron, Vite, React, WireGuard Helper)
├── packages/
│   ├── shared/         # Tipe data, utilitas formatters, resolver negara (@univpn/shared)
│   ├── api/            # API client HTTP (@univpn/api)
│   ├── vpn-core/       # Core logika VPN state (@univpn/vpn-core)
│   └── vpn-platform/   # Driver & helper WireGuard platform (@univpn/vpn-platform)
├── distribution/       # Catatan rilis Play Store & metadata updater
├── docs/               # Panduan workflow rilis dan spesifikasi desain
└── scripts/            # Script otomatisasi rilis (scripts/release.sh)
```

---

## 🛠️ Pengembangan Lokal (Development)

### Prasyarat
* [Bun](https://bun.sh/) (disarankan versi terbaru)
* Node.js 20+

### Menjalankan Mobile
```bash
# Install dependensi di root
bun install

# Jalankan mobile app
cd apps/mobile
bun start          # Dev server Metro
bun run android    # Build & run emulator Android
bun run ios        # Build & run simulator iOS
```

### Menjalankan Desktop
```bash
# Jalankan desktop app
cd apps/desktop
bun run dev        # Dev mode (Electron + Vite HMR)

# Build installer lokal
bun run build
bun run dist:mac   # Build macOS DMG & ZIP
bun run dist:win   # Build Windows installer
```

### Menjalankan Tes
```bash
# Unit test di seluruh monorepo
bun test

# Verifikasi driver & integrasi desktop
cd apps/desktop
bun run verify
```

---

## 🚀 Alur Rilis (Release Flow)

Untuk membuat rilis baru (Internal maupun Produksi):
```bash
# Jalankan wizard rilis otomatis
bun run release
```
Panduan lengkap penamaan tag dan GitHub Actions CI dapat dibaca di [docs/RELEASE_WORKFLOW.md](docs/RELEASE_WORKFLOW.md).
