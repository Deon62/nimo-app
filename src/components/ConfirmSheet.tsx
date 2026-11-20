import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Minimal action sheet used instead of system alerts (works on every platform). */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { paddingBottom: Math.max(bottom, spacing.lg) + spacing.sm }]}>
        <View style={styles.handle} />
        <AppText variant="headline" align="center">
          {title}
        </AppText>
        {message && (
          <AppText variant="subhead" tone="secondary" align="center" style={styles.message}>
            {message}
          </AppText>
        )}
        <View style={styles.actions}>
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={destructive ? 'destructive' : 'primary'}
            size="large"
          />
          <Button label="Cancel" onPress={onCancel} variant="plain" size="large" />
        </View>
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
    marginBottom: spacing.xl,
  },
  message: { marginTop: 6 },
  actions: { marginTop: spacing.xxl, gap: spacing.xs },
});
