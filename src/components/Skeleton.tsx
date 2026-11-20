import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, spacing } from '@/theme';

/** Placeholder rows shown while (mock) data loads. */
export function SkeletonRows({ count = 4, avatarSize = 52 }: { count?: number; avatarSize?: number }) {
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={style} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.block, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
          <View style={styles.lines}>
            <View style={[styles.block, styles.lineShort]} />
            <View style={[styles.block, styles.lineLong]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, paddingVertical: spacing.md },
  lines: { flex: 1, gap: 8 },
  block: { backgroundColor: colors.background.secondary, borderRadius: 6 },
  lineShort: { width: '38%', height: 14 },
  lineLong: { width: '78%', height: 12 },
});
