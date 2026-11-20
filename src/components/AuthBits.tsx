import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import { FormField } from './FormField';
import { PressableScale } from './PressableScale';
import { SocialIcon, type SocialKind } from './SocialIcon';

const SOCIAL_SIZE = 64;
const SOCIAL_LABEL: Record<SocialKind, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  phone: 'Continue with mobile number',
};

/** Google, Apple and mobile as three identical round buttons. */
export function SocialRow({
  onPick,
  loading,
  disabled,
}: {
  onPick: (kind: SocialKind) => void;
  loading?: SocialKind | null;
  disabled?: boolean;
}) {
  return (
    <View style={styles.socialRow}>
      {(['google', 'apple', 'phone'] as const).map((kind) => (
        <PressableScale
          key={kind}
          onPress={() => onPick(kind)}
          disabled={disabled || !!loading}
          accessibilityRole="button"
          accessibilityLabel={SOCIAL_LABEL[kind]}
          accessibilityState={{ busy: loading === kind }}
          activeScale={0.92}
          style={styles.social}
        >
          {loading === kind ? <ActivityIndicator color={colors.ink} /> : <SocialIcon kind={kind} />}
        </PressableScale>
      ))}
    </View>
  );
}

export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <View style={styles.divider} accessibilityElementsHidden>
      <View style={styles.line} />
      <AppText variant="footnote" tone="tertiary">
        {label}
      </AppText>
      <View style={styles.line} />
    </View>
  );
}

export function PasswordField(props: Omit<React.ComponentProps<typeof FormField>, 'secureTextEntry' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <FormField
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Icon size={20} color={colors.text.secondary} strokeWidth={1.8} />
        </Pressable>
      }
    />
  );
}

/** "New to Nimo? Sign up" style footer link. */
export function AuthSwitch({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link" style={styles.switch}>
      <AppText variant="subhead" tone="secondary" align="center">
        {prompt}{' '}
        <AppText variant="subhead" weight="600">
          {action}
        </AppText>
      </AppText>
    </Pressable>
  );
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const styles = StyleSheet.create({
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  social: {
    width: SOCIAL_SIZE,
    height: SOCIAL_SIZE,
    borderRadius: SOCIAL_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border },
  switch: { paddingVertical: spacing.sm },
});
