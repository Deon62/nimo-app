import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'plain' | 'destructive' | 'light' | 'outlineDark';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: 'regular' | 'large';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const palette: Record<Variant, { bg: string; fg: 'inverse' | 'danger' | 'primary'; border?: string }> = {
  primary: { bg: colors.ink, fg: 'inverse' },
  secondary: { bg: 'transparent', fg: 'primary', border: colors.border },
  plain: { bg: 'transparent', fg: 'primary' },
  destructive: { bg: 'transparent', fg: 'danger', border: colors.border },
  light: { bg: '#FFFFFF', fg: 'primary' },
  outlineDark: { bg: 'transparent', fg: 'inverse', border: 'rgba(255, 255, 255, 0.28)' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  size = 'regular',
  style,
  accessibilityHint,
}: ButtonProps) {
  const { bg, fg, border } = palette[variant];
  const isDisabled = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        size === 'large' ? styles.large : styles.regular,
        { backgroundColor: bg },
        border ? { borderWidth: 1, borderColor: border } : null,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg === 'inverse' ? '#FFFFFF' : colors.text.secondary} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText variant={size === 'large' ? 'headline' : 'callout'} weight="600" tone={fg}>
            {label}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 20,
  },
  regular: { minHeight: 44 },
  large: { minHeight: 54 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.45 },
});
