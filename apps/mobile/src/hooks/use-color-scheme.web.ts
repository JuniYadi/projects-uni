import { useEffect, useState } from 'react';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { colorScheme } = useNativewindColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
