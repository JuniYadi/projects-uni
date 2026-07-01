export const PACKAGE_REGEX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;

export function validatePackageName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Package name is required';
  if (!PACKAGE_REGEX.test(trimmed)) return 'Use a valid package name like com.example.app';
  return null;
}

export function extractPackageNameFromPlayStoreUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Supports both play.google.com and play.store.com URLs, e.g.:
  // https://play.google.com/store/apps/details?id=com.example.app
  // https://play.google.com/store/apps/details?id=com.example.app&hl=en
  const match = trimmed.match(/[?&]id=([a-zA-Z0-9._]+)/);
  const packageName = match?.[1] ?? null;

  if (packageName && PACKAGE_REGEX.test(packageName)) {
    return packageName;
  }
  return null;
}

export function extractPackageNameFromUrl(url: string): string | null {
  // Try Play Store URL first
  const fromPlayStore = extractPackageNameFromPlayStoreUrl(url);
  if (fromPlayStore) return fromPlayStore;

  // Fallback: if the user pasted a raw package name, validate it directly
  const trimmed = url.trim();
  if (validatePackageName(trimmed) === null) return trimmed;

  return null;
}
