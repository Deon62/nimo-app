import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontFamily, spacing } from '@/theme';
import { AppText } from './AppText';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  trailing?: React.ReactNode;
}

/** Labelled text input with a hairline underline; turns red with a message when invalid. */
export function FormField({ label, error, trailing, ...input }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="footnote" tone="secondary">
        {label}
      </AppText>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <TextInput
          placeholderTextColor={colors.text.tertiary}
          selectionColor={colors.ink}
          accessibilityLabel={label}
          style={styles.input}
          {...input}
        />
        {trailing}
      </View>
      {error && (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.border,
  },
  rowError: { borderBottomColor: colors.accent.danger },
  input: {
    flex: 1,
    height: 44,
    fontFamily,
    fontSize: 17,
    color: colors.text.primary,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as object,
});
