import { Text, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent' | 'danger' | 'success';

const toneColor: Record<Tone, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  inverse: colors.text.inverse,
  accent: colors.accent.blue,
  danger: colors.accent.danger,
  success: colors.accent.success,
};

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  weight?: '400' | '500' | '600' | '700';
  align?: 'left' | 'center' | 'right';
}

export function AppText({ variant = 'body', tone = 'primary', weight, align, style, ...rest }: AppTextProps) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.4}
      style={[
        typography[variant],
        { color: toneColor[tone] },
        weight && { fontWeight: weight },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
