import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="section" accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          {({ pressed }) => (
            <AppText variant="subhead" tone="secondary" style={{ opacity: pressed ? 0.5 : 1 }}>
              {actionLabel}
            </AppText>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
});
