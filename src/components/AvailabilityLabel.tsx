import { StyleSheet, View } from 'react-native';

import { availabilityLabel, type Availability } from '@/data/agents';
import { colors } from '@/theme';
import { AppText } from './AppText';

const dotColor: Record<Availability, string> = {
  available: colors.accent.success,
  busy: '#FF9F0A',
  offline: colors.text.tertiary,
};

export function AvailabilityLabel({ availability }: { availability: Availability }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor[availability] }]} />
      <AppText variant="caption" tone="secondary">
        {availabilityLabel[availability]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
