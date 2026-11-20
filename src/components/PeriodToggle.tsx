import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { BillingPeriod } from '@/state/AccountContext';
import { colors } from '@/theme';
import { AppText } from './AppText';

const WIDTH = 248;
const HEIGHT = 46;
const PAD = 4;

interface PeriodToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  /** e.g. "-20%", shown beside Yearly. */
  yearlyBadge?: string;
}

/** Compact frosted-glass segmented control with a sliding thumb. */
export function PeriodToggle({ value, onChange, yearlyBadge }: PeriodToggleProps) {
  const [width, setWidth] = useState(WIDTH);
  const half = (width - PAD * 2) / 2;
  const thumb = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: withTiming(value === 'monthly' ? 0 : half, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
        },
      ],
    }),
    [value, half],
  );

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="radiogroup">
      <BlurView intensity={Platform.OS === 'ios' ? 40 : 24} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.frost]} />
      <Animated.View style={[styles.thumb, { width: half }, thumb]} />
      {(['monthly', 'yearly'] as const).map((p) => {
        const on = value === p;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={p === 'monthly' ? 'Monthly' : `Yearly${yearlyBadge ? `, save ${yearlyBadge}` : ''}`}
            style={styles.item}
          >
            <AppText variant="subhead" weight={on ? '600' : '500'} tone={on ? 'primary' : 'secondary'}>
              {p === 'monthly' ? 'Monthly' : 'Yearly'}
            </AppText>
            {p === 'yearly' && yearlyBadge && (
              <AppText variant="caption" weight="600" style={styles.badge}>
                {yearlyBadge}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WIDTH,
    height: HEIGHT,
    alignSelf: 'center',
    flexDirection: 'row',
    padding: PAD,
    borderRadius: HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  frost: { backgroundColor: 'rgba(118, 118, 128, 0.12)' },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    bottom: PAD,
    borderRadius: (HEIGHT - PAD * 2) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' } as object,
    }),
  },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  badge: { color: colors.text.secondary },
});
