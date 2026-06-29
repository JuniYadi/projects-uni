// ponytail: country codes → flag emoji via Regional Indicator Symbols
export function countryFlag(code: string): string {
  if (code.length !== 2) return '🏳️';
  const base = 0x1F1E6;
  const a = code.charCodeAt(0) - 65;
  const b = code.charCodeAt(1) - 65;
  if (a < 0 || a > 25 || b < 0 || b > 25) return '🏳️';
  return String.fromCodePoint(base + a, base + b);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

export function formatPing(ms: number): { label: string; color: string } {
  if (ms < 50) return { label: `${ms}ms`, color: '#34c759' };
  if (ms < 100) return { label: `${ms}ms`, color: '#ff9f0a' };
  return { label: `${ms}ms`, color: '#ff3b30' };
}
