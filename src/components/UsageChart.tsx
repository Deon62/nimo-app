import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import type { DailyUsage } from '@/data/plans';
import { colors, fontFamily } from '@/theme';
import { AppText } from './AppText';

const CHART_HEIGHT = 148;
const BAR_WIDTH = 22;

interface UsageChartProps {
  data: DailyUsage[];
  /** Daily allowance, drawn as a dashed reference line. */
  limit: number;
}

function Bar({
  item,
  max,
  index,
  selected,
  onSelect,
}: {
  item: DailyUsage;
  max: number;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.set(withDelay(index * 55, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })));
  }, [grow, index]);

  const height = Math.max(4, (item.minutes / max) * CHART_HEIGHT);
  const style = useAnimatedStyle(() => ({ height: height * grow.get() }));
  const emphasised = selected || item.isToday;

  return (
    <Pressable
      onPress={onSelect}
      style={styles.column}
      hitSlop={{ top: 8, bottom: 8 }}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}: ${item.minutes} minutes`}
      accessibilityState={{ selected }}
    >
      <View style={styles.tipSlot}>
        {selected && (
          <View style={styles.tip}>
            <AppText variant="caption" weight="600" tone="inverse" style={styles.tipText}>
              {item.minutes} min
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { backgroundColor: emphasised ? colors.ink : '#D9D9DE' }, style]} />
      </View>
      <AppText
        variant="caption"
        weight={item.isToday ? '600' : '400'}
        tone={item.isToday ? 'primary' : 'secondary'}
        style={styles.day}
      >
        {item.isToday ? 'Today' : item.label}
      </AppText>
    </Pressable>
  );
}

/** Seven-day minutes bar chart with the daily limit marked. Tap a bar for its value. */
export function UsageChart({ data, limit }: UsageChartProps) {
  const [selected, setSelected] = useState<number>(data.length - 1);
  const max = Math.max(limit, ...data.map((d) => d.minutes));
  const limitOffset = (limit / max) * CHART_HEIGHT;

  return (
    <View
      accessible={false}
      accessibilityLabel={`Minutes per day, last seven days: ${data.map((d) => `${d.label} ${d.minutes}`).join(', ')}`}
    >
      <View style={styles.plot}>
        {/* Daily limit reference line */}
        <View pointerEvents="none" style={[styles.limit, { bottom: limitOffset + 22 }]}>
          <View style={styles.dashes}>
            {Array.from({ length: 40 }, (_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>
          <AppText variant="caption" tone="tertiary" style={styles.limitLabel}>
            {limit} min
          </AppText>
        </View>
        {data.map((item, i) => (
          <Bar key={i} item={item} max={max} index={i} selected={selected === i} onSelect={() => setSelected(i)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  column: { alignItems: 'center', flex: 1 },
  tipSlot: { height: 30, justifyContent: 'flex-end', paddingBottom: 6 },
  tip: { backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  tipText: { fontFamily, fontVariant: ['tabular-nums'] },
  track: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  day: { marginTop: 6, height: 16 },
  limit: { position: 'absolute', left: 0, right: 0 },
  dashes: { flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden' },
  dash: { width: 4, height: 1, backgroundColor: colors.text.tertiary },
  limitLabel: { fontFamily, position: 'absolute', left: 0, bottom: 4 },
});
