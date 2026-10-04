import { useWindowDimensions } from 'react-native';
import { breakpointFor, maxContentWidth } from '@univpn/design-tokens';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const breakpoint = breakpointFor(width);
  return { breakpoint, maxWidth: maxContentWidth[breakpoint] };
}
