import { useWindowDimensions } from 'react-native';

export const TABLET_MIN_WIDTH = 768;

export function useIsTablet() {
  return useWindowDimensions().width >= TABLET_MIN_WIDTH;
}
