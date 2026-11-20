import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, hitTarget } from '@/theme';
import { PressableScale } from './PressableScale';

interface HeaderIconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  /** Shows a small dot, e.g. when a filter is applied. */
  badge?: boolean;
}

/** Plain icon button for screen title rows. */
export function HeaderIconButton({ icon: Icon, onPress, accessibilityLabel, badge }: HeaderIconButtonProps) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} activeScale={0.9} style={styles.button}>
      <Icon size={23} color={colors.ink} strokeWidth={1.8} />
      {badge && <View style={styles.badge} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { width: hitTarget, height: hitTarget, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 9,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
