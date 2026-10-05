# Design System & Guidelines — UniVPN v2

Dokumen ini adalah acuan resmi desain UI/UX untuk aplikasi UniVPN (Mobile & Desktop).

---

## 1. Prinsip Utama

- **Simple Default, Advanced Opt-in**: Tampilan utama bersih, intuitif, dan ramah untuk pengguna awam. Pengaturan teknis (DNS, protokol, log) diletakkan di Mode Lanjutan.
- **Bahasa Ramah & Lugas**: Menghindari jargon teknis di layar utama (misal: *Kill switch* → *Putus otomatis aman*).
- **Aksen Tunggal**: Warna hijau sebagai aksen utama, hanya dipakai untuk status aman/terlindungi, status tercepat, atau tombol tindakan utama.
- **Konsistensi Lintas Platform**: Pengalaman visual yang padu di Android, iOS, tablet, dan desktop.

---

## 2. Palet Warna (Color Tokens)

UniVPN menggunakan palet dasar **Slate & Green** (abu-abu kebiruan netral dengan aksen hijau).

### Mode Gelap (Dark Mode — Default)
| Elemen | Token CSS | Nilai HEX | Keterangan |
|---|---|---|---|
| **Latar Layar** | `--bg` | `#0F172A` | Slate 900, latar utama aplikasi |
| **Kartu / Komponen** | `--card` | `#192134` | Kontainer baris server, dialog, & form |
| **Latar Terpilih** | `--card-active` | `#243049` | Item aktif atau badge seleksi |
| **Teks Utama** | `--fg` | `#F8FAFC` | Slate 50, judul & label utama |
| **Teks Redup / Keterangan** | `--mut` | `#94A3B8` | Slate 400, subteks & label sekunder |
| **Aksen Hijau** | `--accent` | `#22C55E` | Green 500, status tersambung & Cepat |
| **Garis / Border** | `--line` | `rgba(255, 255, 255, 0.08)` | Border halus di sekeliling kartu |
| **Error / Bahaya** | `--error` | `#F87171` | Red 400, gagal koneksi / kedaluwarsa |

### Mode Terang (Light Mode)
| Elemen | Token CSS | Nilai HEX | Keterangan |
|---|---|---|---|
| **Latar Layar** | `--bg` | `#F1F5F9` | Slate 100, latar utama terang |
| **Kartu / Komponen** | `--card` | `#FFFFFF` | Putih bersih untuk kartu & list |
| **Latar Terpilih** | `--card-active` | `#E2E8F0` | Slate 200, item aktif atau badge |
| **Teks Utama** | `--fg` | `#0F172A` | Slate 900, teks dengan kontras tinggi |
| **Teks Redup / Keterangan** | `--mut` | `#64748B` | Slate 500, subteks terbaca jelas |
| **Aksen Hijau (Teks)** | `--accent-text` | `#16A34A` | Green 600, kontras ≥ 4.5:1 untuk teks |
| **Aksen Hijau (Ikon/Tombol)** | `--accent` | `#22C55E` | Green 500 untuk tombol dan ikon |
| **Garis / Border** | `--line` | `rgba(15, 23, 42, 0.08)` | Border pemisah kartu |
| **Error / Bahaya** | `--error` | `#DC2626` | Red 600, kontras tinggi di latar terang |

---

## 3. Komponen Server & Lokasi

### A. Bendera Negara (Hybrid Architecture: SVG Lokal + CDN Cache)
- Setiap lokasi server ditampilkan dengan **bendera melingkar**, bukan sekadar teks inisial kode negara.
- **Strategi Hybrid**:
  - **Server Utama (ID, SG, HK, JP, US)**: Menggunakan vektor SVG lokal langsung (0 ms loading, 100% offline).
  - **Server Baru Dinamis dari API**: Otomatis dimuat via `expo-image` dari FlagCDN (`https://flagcdn.com/w80/{code}.png`) dengan **disk cache permanen** di perangkat.
  - **Fallback Teks**: Jika offline atau kode belum dikenali, otomatis menampilkan inisial kode negara (`NL`, `DE`) tanpa merusak layout.
  - **Penambahan Permanen**: Jika ada server negara baru yang resmi ditambahkan ke fleet, SVG lokalnya dapat diunduh dan disimpan ke kode lokal.
- **Ukuran**:
  - Daftar server (Mobile/Tablet/Desktop window): `36×36px` bulat (`border-radius: 50%`).
  - Menu tray / mini pop-up: `28×28px` bulat (`border-radius: 50%`).
- **Ring Penegas (Border Outline)**:
  - Mode Gelap: `box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15)`
  - Mode Terang: `box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1)` (menjaga batas bendera yang memiliki warna putih di tepinya seperti Indonesia dan Jepang).
### B. Indikator Kecepatan & Latensi
Kecepatan tidak hanya berupa kata kualitatif, melainkan dilengkapi **detail latensi riil dalam milidetik (ms)**:
- **Format**: `<Nama Kota> · <Status Kecepatan> · <Angka> ms`
  - Contoh:
    - `Singapore · Cepat · 18 ms` (Aksen hijau)
    - `Jakarta · Cepat · 28 ms` (Aksen hijau)
    - `Hong Kong · Normal · 145 ms` (Kuning / Amber `#F59E0B`)
    - `Tokyo · Normal · 165 ms` (Kuning / Amber `#F59E0B`)
    - `Amerika Serikat · Jauh · 240 ms` (Abu-abu Slate)
- **Saat Pengukuran Berlangsung**:
  - Indikator global: Spinner hijau + teks `Mengukur kecepatan…`
  - Subteks baris: `mengukur…` (warna teks redup `#94A3B8` / `#64748B`).


### C. Konsistensi Kartu Server di Beranda
Kartu lokasi yang dipilih di layar **Beranda** (Home) diselaraskan agar sama lengkap dan informatifnya dengan daftar di layar Lokasi:
- **Sisi Kiri**: Bendera SVG melingkar negara terkait.
- **Sisi Tengah**:
  - **Baris Atas**: Nama Negara / Wilayah (misal: `Singapore`, `font-weight: 500`).
  - **Baris Bawah**: Detail kota & latensi (misal: `Singapore · Cepat · 18 ms`, `font-size: 12px` dengan aksen status hijau/amber).
- **Sisi Kanan**: Ikon panah/chevron `>` sebagai penanda bahwa kartu dapat diketuk untuk berpindah atau memilih server lain.
- **Aturan**: Tidak menggunakan label generik statis "Lokasi" atau kode teknis internal (seperti `SG-01`) tanpa konteks wilayah dan kecepatan.
---

## 4. Tipografi

Font resmi: **Figtree** (cadangan: Inter, system-ui, sans-serif).

| Penggunaan | Ukuran | Weight | Warna (Gelap / Terang) |
|---|---|---|---|
| **Judul Layar** | 18–20px | Semi-Bold (600) | `#F8FAFC` / `#0F172A` |
| **Nama Server / Label Form** | 14px | Medium (500) | `#F8FAFC` / `#0F172A` |
| **Subteks / Kecepatan / Keterangan** | 12px | Regular (400) | `#94A3B8` / `#64748B` |
| **Label Bagian (Section Header)** | 12px | Semi-Bold (600), Uppercase | `#94A3B8` / `#64748B` |
| **Teks Tombol Utama** | 15px | Semi-Bold (600) | `#052E16` di atas `#22C55E` |
| **Status Tab Bar** | 11px | Regular / Medium | Aksen jika aktif, redup jika tidak |

---

## 5. Glosarium Istilah Ramah Pengguna

| Istilah Teknis | Teks di Layar UniVPN |
|---|---|
| Kill switch | Putus otomatis aman |
| Auto-connect | Sambung otomatis |
| Split tunneling | Pilih aplikasi |
| Latency / Ping | Cepat / Normal / Jauh + angka ms (cth: `Cepat · 18 ms`) |
| Subscription ID | ID Langganan |

---

## 6. Standar Aksesibilitas & Interaksi

- **Target Sentuh Minimum**: `≥ 44×44px` untuk semua tombol dan baris yang dapat diklik.
- **Kontras Rasio Teks**: Minimal `4.5:1` terhadap warna latar belakang.
- **Animasi & Motion**:
  - Durasi sentuh / toggle: `120–150 ms` (ease-out).
  - Sheet / dialog masuk: `200–300 ms` (cubic-bezier(.2, .8, .2, 1)).
  - Mendukung `prefers-reduced-motion`: animasi kompleks (seperti denial peta atau ripple) otomatis diganti bentuk statis jika diaktifkan pengguna.

### Animasi Status Tombol Daya (Power Button Motion)
1. **Belum Tersambung (Idle)**:
   - Statis dengan ring netral halus (`rgba(255,255,255,0.06)` gelap / `rgba(15,23,42,0.06)` terang).
2. **Sedang Menyambung (Connecting)**:
   - Spinner hijau memutar kontinu mengelilingi tombol (`1s` linear infinite).
3. **Tersambung (Connected)**:
   - **Pop Bounce**: Sentakan responsif saat berhasil terhubung (`~350ms`).
   - **Gelombang Denyut Berulang (Continuous Ripple Waves)**: Dua lingkaran hijau memancar keluar secara kontinu (`scale 1.0` ke `1.65`, `opacity 0.8` ke `0`, durasi `2.4s - 3.0s`, jeda antar gelombang `~1.2s`), memberi kepastian visual bahwa koneksi perisai VPN sedang aktif melindungi.
   - **Glow Breathing**: Pendaran hijau di sekeliling tombol berdenyut halus mengikuti irama napas santai (`3s` ease-in-out).
4. **Gagal (Failed)**:
   - Animasi goyangan horizontal (*shake*) singkat (`~350ms`) dengan aksen warna merah.
5. **Terputus Tiba-tiba (Dropped)**:
   - Denyut pulsa merah berulang (*heartbeat beat*) memperingatkan bahwa internet diamankan oleh Putus Otomatis Aman (*kill switch*).
