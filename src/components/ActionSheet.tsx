import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export interface SheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  /** Shows a tick, for choosing one option from a list. */
  selected?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}

/** Bottom sheet with a list of actions. Choosing one closes the sheet. */
export function ActionSheet({ visible, title, actions, onClose }: ActionSheetProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { paddingBottom: Math.max(bottom, spacing.lg) + spacing.sm }]}>
        <View style={styles.handle} />
        {title && (
          <AppText variant="headline" align="center" style={styles.title}>
            {title}
          </AppText>
        )}
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: !!action.selected }}
          >
            {({ pressed }) => (
              <View style={[styles.action, pressed && styles.pressed]}>
                <AppText
                  variant="body"
                  weight={action.selected ? '600' : '400'}
                  tone={action.destructive ? 'danger' : 'primary'}
                >
                  {action.label}
                </AppText>
                {action.selected && <View style={styles.dot} />}
              </View>
            )}
          </Pressable>
        ))}
        <Pressable onPress={onClose} accessibilityRole="button">
          {({ pressed }) => (
            <View style={[styles.action, styles.cancel, pressed && styles.pressed]}>
              <AppText variant="body" weight="600" tone="secondary">
                Cancel
              </AppText>
            </View>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.32)' },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.sm },
  action: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancel: { justifyContent: 'center', marginTop: spacing.xs },
  pressed: { opacity: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
});
