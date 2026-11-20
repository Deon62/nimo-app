import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Hairline separator, optionally inset to align with text after an avatar. */
export function Separator({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.line, { marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
