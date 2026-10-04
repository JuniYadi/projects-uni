import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { radius, spacing } from '@univpn/design-tokens';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

type SheetProps = { visible: boolean; onClose: () => void; children: ReactNode };

/** Bottom sheet; centered and width-capped on tablet/desktop. */
export function Sheet({ visible, onClose, children }: SheetProps) {
  const theme = useTheme();
  const { maxWidth } = useBreakpoint();

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable
          style={{
            width: '100%',
            maxWidth: Math.min(maxWidth, 720),
            padding: spacing.four,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            backgroundColor: theme.background,
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              marginBottom: spacing.three,
              borderRadius: radius.pill,
              backgroundColor: theme.border,
            }}
          />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
