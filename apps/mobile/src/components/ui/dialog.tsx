import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Overlay } from './overlay';

/** Put `Button`s in `children` (e.g. Batal + Keluar). */
export function Dialog({
  visible,
  onClose,
  title,
  message,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Overlay visible={visible} onClose={onClose} kind="dialog">
      <View
        accessibilityViewIsModal
        style={{ backgroundColor: theme.backgroundElement, borderRadius: 20, padding: 20, gap: 12 }}
      >
        <Text style={{ fontFamily: Figtree.semibold, fontSize: 18, color: theme.text }}>{title}</Text>
        {message && (
          <Text style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary }}>{message}</Text>
        )}
        <View style={{ gap: 8, marginTop: 4 }}>{children}</View>
      </View>
    </Overlay>
  );
}
