# Panduan Alur Rilis UniVPN

Dokumen ini menjelaskan aturan, standar, dan cara merilis UniVPN untuk platform **Mobile (Android)** dan **Desktop (Windows & macOS)**.

---

## 1. Aturan Penamaan Tag Rilis

Semua rilis wajib menggunakan format tag berikut agar GitHub Actions CI dapat memproses target platform dan jalurnya secara otomatis:

| Format Tag | Platform | Jalur Rilis | Distribusi Otomatis |
|---|---|---|---|
| `v<version>-mobile` | Mobile (Android) | **Rilis Produksi** | AAB ke Google Play Track Alpha/Produksi + APK terlampir di GitHub Release |
| `v<version>-mobile-internal` | Mobile (Android) | **Rilis Internal** | AAB ke Google Play Track Internal + APK terlampir di GitHub Release |
| `v<version>-desktop` | Desktop (Windows & macOS) | **Rilis Produksi** | Installer Windows `.exe` (NSIS & Portable) dan macOS `.dmg`/`.zip` otomatis terlampir di GitHub Release |
| `v<version>-desktop-internal` | Desktop (Windows & macOS) | **Rilis Internal** | Installer Windows `.exe` (NSIS & Portable) dan macOS `.dmg`/`.zip` otomatis terlampir di GitHub Release |

Contoh tag yang valid:
- `v0.3.0-mobile`
- `v0.3.0-mobile-internal`
- `v0.3.0-desktop`
- `v0.3.0-desktop-internal`

---

## 2. Cara Rilis Otomatis (Direkomendasikan)

Gunakan perintah release script yang sudah disediakan:

```bash
# Mode Interaktif (Wizard tanya-jawab)
bun run release
```
atau langsung dengan script bash:
```bash
./scripts/release.sh
```

### Opsi Non-Interaktif (Satu Baris):
```bash
# Format: ./scripts/release.sh <platform> <jalur> <versi> [catatan]

# Contoh 1: Rilis Produksi Desktop
./scripts/release.sh desktop production 0.3.1 "- Perbaikan koneksi WireGuard\n- Optimasi tema gelap"

# Contoh 2: Rilis Internal Mobile
./scripts/release.sh mobile internal 0.3.1 "Build pengujian internal fitur whitelist"
```

---

## 3. Apa Saja yang Dilakukan Script Rilis Otomatis?

1. **Validasi**:
   - Memeriksa autentikasi `gh` CLI.
   - Memeriksa apakah branch saat ini adalah `main`.
   - Memeriksa apakah tag sudah pernah dibuat sebelumnya.
2. **Sinkronisasi Versi**:
   - **Mobile**: Memperbarui `version` dan menaikkan `versionCode` di `apps/mobile/app.json`.
   - **Mobile**: Memperbarui catatan rilis di `distribution/whatsnew/whatsnew-id-ID` (maksimal 500 karakter sesuai syarat Play Store).
   - **Desktop**: Memperbarui `version` di `apps/desktop/package.json`.
   - **Changelog**: Menambahkan entri rilis baru ke `CHANGELOG.md` (untuk rilis produksi).
3. **Git Commit & Push**:
   - Melakukan commit `chore(release): bump <platform> to v<version> for <jalur> release`.
   - Melakukan push perubahan ke branch remote.
4. **GitHub Release**:
   - Menjalankan `gh release create <tag> --title ... --notes ...`.
   - Memicu workflow GitHub Actions yang relevan secara otomatis.

---

## 4. Alur Kerja GitHub Actions CI di Balik Layar

```
                ┌──────────────────────────────────────┐
                │          gh release create           │
                │        (contoh: v0.3.0-desktop)      │
                └──────────────────┬───────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   build-android.yml                        build-desktop.yml
   (Filter: Bukan -desktop)                 (Filter: Harus ada -desktop)
              │                                         │
              ▼                                         ▼
   [DILEWATI / SKIPPED]                     [DIJALANKAN]
                                                        │
                                            ┌───────────┴───────────┐
                                            ▼                       ▼
                                       -internal?               Bukan -internal?
                                            │                       │
                                   [Rilis Internal]         [Rilis Produksi]
                                            │                       │
                                            └───────────┬───────────┘
                                                        │
                                                        ▼
                                            [Matrix Parallel: Windows & macOS]
                                            • Windows: compile:helper -> build -> dist:win (.exe)
                                            • macOS: compile:helper:mac -> build -> dist:mac (.dmg, .zip)
                                            • shasum -a 256: generate file SHA256SUMS-<platform>.txt
                                            • gh release upload: lampirkan semua installer & SHA256 ke rilis
