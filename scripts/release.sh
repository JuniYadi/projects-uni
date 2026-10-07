#!/usr/bin/env bash
set -e

# ==============================================================================
# UniVPN Release Script
# Standardized flow for releasing Mobile and Desktop (Internal & Production)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}             UniVPN Automated Release Flow            ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Pastikan gh CLI terinstal dan sudah login
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI ('gh') belum terinstal.${NC}"
  echo "Silakan install via 'brew install gh' lalu login dengan 'gh auth login'."
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI belum login. Jalankan 'gh auth login' terlebih dahulu.${NC}"
  exit 1
fi

# 2. Pastikan branch main up-to-date
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}Peringatan: Kamu sedang berada di branch '$CURRENT_BRANCH', bukan 'main'.${NC}"
  read -p "Lanjut tetap di branch ini? (y/N): " CONTINUE_BRANCH
  if [[ ! "$CONTINUE_BRANCH" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# ==============================================================================
# INPUT ARGUMENTS ATAU INTERAKTIF
# ==============================================================================

PLATFORM="$1"
ENV_TYPE="$2"
VERSION="$3"
NOTES="$4"

# Platform Selection
if [ -z "$PLATFORM" ]; then
  echo ""
  echo "Pilih Platform yang ingin dirilis:"
  echo "  1) mobile  (Android - AAB & APK)"
  echo "  2) desktop (Windows .exe & macOS .dmg/.zip)"
  read -p "Pilihan (1/2): " PLAT_OPT
  case "$PLAT_OPT" in
    1|mobile)  PLATFORM="mobile" ;;
    2|desktop) PLATFORM="desktop" ;;
    *) echo -e "${RED}Pilihan tidak valid.${NC}"; exit 1 ;;
  esac
fi

# Environment Selection (Internal vs Production)
if [ -z "$ENV_TYPE" ]; then
  echo ""
  echo "Pilih Jalur Rilis:"
  echo "  1) produksi (Rilis Publik / Production)"
  echo "  2) internal (Rilis Pengujian / Internal Track)"
  read -p "Pilihan (1/2): " ENV_OPT
  case "$ENV_OPT" in
    1|produksi|production) ENV_TYPE="production" ;;
    2|internal)            ENV_TYPE="internal" ;;
    *) echo -e "${RED}Pilihan tidak valid.${NC}"; exit 1 ;;
  esac
fi

# Baca Versi Saat Ini
if [ "$PLATFORM" = "mobile" ]; then
  CURRENT_VER=$(node -p "require('./apps/mobile/app.json').expo.version")
  CURRENT_CODE=$(node -p "require('./apps/mobile/app.json').expo.android.versionCode")
  echo -e "Versi Mobile saat ini: ${GREEN}${CURRENT_VER}${NC} (versionCode: ${CURRENT_CODE})"
else
  CURRENT_VER=$(node -p "require('./apps/desktop/package.json').version")
  echo -e "Versi Desktop saat ini: ${GREEN}${CURRENT_VER}${NC}"
fi

# Version Selection
if [ -z "$VERSION" ]; then
  read -p "Masukkan versi baru (contoh: ${CURRENT_VER}): " INPUT_VER
  VERSION="${INPUT_VER:-$CURRENT_VER}"
fi

# Bersihkan prefix 'v' jika ada di input versi
VERSION="${VERSION#v}"

# Hitung Tag sesuai Konvensi Prefix
if [ "$ENV_TYPE" = "internal" ]; then
  TAG="v${VERSION}-${PLATFORM}-internal"
  TITLE="UniVPN $([ "$PLATFORM" = "mobile" ] && echo "Mobile" || echo "Desktop") v${VERSION} (Internal)"
else
  TAG="v${VERSION}-${PLATFORM}"
  TITLE="UniVPN $([ "$PLATFORM" = "mobile" ] && echo "Mobile" || echo "Desktop") v${VERSION}"
fi

# Periksa apakah Tag sudah ada
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo -e "${RED}Error: Tag '$TAG' sudah ada di repositori.${NC}"
  echo "Gunakan versi yang lebih baru (patch/minor bump)."
  exit 1
fi

# ==============================================================================
# CATATAN RILIS (RELEASE NOTES)
# ==============================================================================

if [ -z "$NOTES" ]; then
  echo ""
  echo -e "${YELLOW}Masukkan ringkasan perubahan untuk rilis ini (tekan Ctrl+D setelah selesai, atau ketik langsung):${NC}"
  if [ "$ENV_TYPE" = "internal" ]; then
    DEFAULT_NOTES="Build rilis internal ${PLATFORM} v${VERSION} untuk pengujian."
    read -p "Catatan (kosongkan untuk default): " USER_NOTES
    NOTES="${USER_NOTES:-$DEFAULT_NOTES}"
  else
    echo "Tuliskan poin-poin perubahan (markdown format):"
    USER_NOTES=$(cat)
    if [ -z "$USER_NOTES" ]; then
      echo -e "${RED}Error: Rilis produksi wajib mencantumkan rincian perubahan.${NC}"
      exit 1
    fi
    NOTES="$USER_NOTES"
  fi
fi

# ==============================================================================
# KONFIRMASI RILIS
# ==============================================================================

echo ""
echo -e "${BLUE}------------------------------------------------------${NC}"
echo -e "Target Platform : ${GREEN}${PLATFORM}${NC}"
echo -e "Jalur Rilis     : ${GREEN}${ENV_TYPE}${NC}"
echo -e "Versi Aplikasi  : ${GREEN}${VERSION}${NC}"
echo -e "Tag Rilis       : ${YELLOW}${TAG}${NC}"
echo -e "Judul Rilis     : ${YELLOW}${TITLE}${NC}"
echo -e "${BLUE}------------------------------------------------------${NC}"
echo "Catatan Rilis:"
echo "$NOTES"
echo -e "${BLUE}------------------------------------------------------${NC}"
read -p "Eksekusi rilis sekarang? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Rilis dibatalkan."
  exit 0
fi

# ==============================================================================
# UPDATE VERSI DAN ARTEFAK SESUAI PLATFORM
# ==============================================================================

DATE_NOW=$(date +%Y-%m-%d)

if [ "$PLATFORM" = "mobile" ]; then
  # 1. Update app.json
  IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$VERSION"
  V_MAJOR=${V_MAJOR:-0}
  V_MINOR=${V_MINOR:-0}
  V_PATCH=${V_PATCH:-0}
  NEW_CODE=$(( V_MAJOR * 10000 + V_MINOR * 100 + V_PATCH ))
  if [ "$NEW_CODE" -le "$CURRENT_CODE" ]; then
    NEW_CODE=$(( CURRENT_CODE + 1 ))
  fi

  echo "Mengupdate apps/mobile/app.json (version: $VERSION, versionCode: $NEW_CODE)..."
  node -e "
    const fs = require('fs');
    const p = './apps/mobile/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.expo.version = '$VERSION';
    j.expo.android.versionCode = $NEW_CODE;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  "

  # 2. Update distribution/whatsnew (Play Store strictly <= 500 chars)
  WHATSNEW_FILE="distribution/whatsnew/whatsnew-id-ID"
  if [ -f "$WHATSNEW_FILE" ]; then
    echo "Mengupdate $WHATSNEW_FILE..."
    WHATSNEW_CONTENT="v${VERSION} telah tersedia!\n\n${NOTES}"
    # Truncate if > 500 chars
    if [ ${#WHATSNEW_CONTENT} -gt 490 ]; then
      WHATSNEW_CONTENT="${WHATSNEW_CONTENT:0:487}..."
    fi
    echo -e "$WHATSNEW_CONTENT" > "$WHATSNEW_FILE"
  fi

elif [ "$PLATFORM" = "desktop" ]; then
  # Update apps/desktop/package.json
  echo "Mengupdate apps/desktop/package.json (version: $VERSION)..."
  node -e "
    const fs = require('fs');
    const p = './apps/desktop/package.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.version = '$VERSION';
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  "
fi

# 3. Update CHANGELOG.md jika rilis produksi
if [ "$ENV_TYPE" = "production" ] && [ -f "CHANGELOG.md" ]; then
  echo "Menambahkan entri ke CHANGELOG.md..."
  CHANGELOG_HEADER="## [${TAG}] - ${DATE_NOW}\n\n${NOTES}\n"
  python3 -c "
with open('CHANGELOG.md', 'r') as f:
    content = f.read()
marker = '# Changelog\n\nAll notable changes to UniVPN are documented here.\n\n'
if marker in content:
    idx = content.find(marker) + len(marker)
    updated = content[:idx] + '''$CHANGELOG_HEADER\n''' + content[idx:]
    with open('CHANGELOG.md', 'w') as f:
        f.write(updated)
"
fi

# ==============================================================================
# COMMIT, PUSH & BUAT GITHUB RELEASE
# ==============================================================================

echo "Membuat commit pembaruan versi..."
git add -A
if ! git diff --cached --quiet; then
  git commit -m "chore(release): bump ${PLATFORM} to v${VERSION} for ${ENV_TYPE} release"
  echo "Pushing ke remote main..."
  git push origin "$CURRENT_BRANCH"
fi

echo "Membuat GitHub Release '$TAG'..."
gh release create "$TAG" \
  --title "$TITLE" \
  --notes "$NOTES"

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}  Rilis $TAG berhasil dibuat!                         ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "CI GitHub Actions otomatis berjalan:"
if [ "$PLATFORM" = "mobile" ]; then
  echo -e "👉 Build Android: AAB akan diunggah ke Google Play ($([ "$ENV_TYPE" = "internal" ] && echo "Track Internal" || echo "Track Alpha/Produksi")) dan APK dilampirkan ke rilis."
else
  echo -e "👉 Build Desktop: File installer (Windows .exe & macOS .dmg/.zip) akan otomatis dilampirkan ke halaman rilis GitHub."
fi
echo -e "Cek status di: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
