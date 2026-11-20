import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

interface OptionSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  onClose: () => void;
}

/** Bottom sheet with a single-choice list. Choosing an option closes it. */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onChange,
  onClose,
}: OptionSheetProps<T>) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { paddingBottom: Math.max(bottom, spacing.lg) + spacing.sm }]}>
        <View style={styles.handle} />
        <AppText variant="headline" align="center" style={styles.title}>
          {title}
        </AppText>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => {
                onChange(option);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              {({ pressed }) => (
                <View style={[styles.option, pressed && styles.pressed]}>
                  <AppText variant="body" weight={selected ? '600' : '400'}>
                    {option}
                  </AppText>
                  {selected && <Check size={20} color={colors.ink} strokeWidth={2.2} />}
                </View>
              )}
            </Pressable>
          );
        })}
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
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.5 },
});
