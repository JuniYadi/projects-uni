export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ponytail: country codes → flag emoji via Regional Indicator Symbols
const COUNTRY_FLAG_OVERRIDES: Record<string, string> = {
  // common names / edge cases
};

export function countryFlag(code: string): string {
  if (COUNTRY_FLAG_OVERRIDES[code]) return COUNTRY_FLAG_OVERRIDES[code];
  if (code.length !== 2) return '🏳️';
  const base = 0x1F1E6;
  const a = code.charCodeAt(0) - 65;
  const b = code.charCodeAt(1) - 65;
  if (a < 0 || a > 25 || b < 0 || b > 25) return '🏳️';
  return String.fromCodePoint(base + a, base + b);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}
