import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[{ backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16 }, style]}
      {...rest}
    />
  );
}
