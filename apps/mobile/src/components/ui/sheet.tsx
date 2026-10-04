import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Overlay } from './overlay';

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Overlay visible={visible} onClose={onClose} kind="sheet">
      <View
        accessibilityViewIsModal
        style={{
          backgroundColor: theme.backgroundElement,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: 32,
          gap: 12,
        }}
      >
        <Text style={{ fontFamily: Figtree.semibold, fontSize: 18, color: theme.text }}>{title}</Text>
        {children}
      </View>
    </Overlay>
  );
}
