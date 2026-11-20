import { useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PlanWaves } from '@/components/PlanWaves';
import { ScreenHeader } from '@/components/ScreenHeader';
import { plans, type Plan, type PlanId } from '@/data/plans';
import { useAccount } from '@/state/AccountContext';
import { colors, radius, spacing } from '@/theme';

const GAP = 14;
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

/** Simple solid emblem per plan. */
function Emblem({ id, color, size = 44 }: { id: PlanId; color: string; size?: number }) {
  const c = color;
  if (id === 'free') {
    return (
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Circle cx="22" cy="22" r="11" fill={c} />
      </Svg>
    );
  }
  if (id === 'plus') {
    return (
      <Svg width={size} height={size} viewBox="0 0 44 44">
        {[0, 90, 180, 270].map((r) => (
          <Circle key={r} cx="22" cy="13" r="9.5" fill={c} transform={`rotate(${r} 22 22)`} />
        ))}
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      {[0, 45, 90, 135].map((r) => (
        <Path key={r} d="M22 3 C25 14 25 30 22 41 C19 30 19 14 22 3 Z" fill={c} transform={`rotate(${r} 22 22)`} />
      ))}
    </Svg>
  );
}

function PlanCard({
  plan,
  index,
  width,
  scrollX,
  current,
  onSubscribe,
}: {
  plan: Plan;
  current: boolean;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  onSubscribe: (plan: Plan) => void;
}) {
  const step = width + GAP;
  const animated = useAnimatedStyle(() => {
    const d = scrollX.get() / step - index;
    return {
      transform: [{ scale: interpolate(Math.abs(d), [0, 1], [1, 0.92], 'clamp') }],
      opacity: interpolate(Math.abs(d), [0, 1], [1, 0.55], 'clamp'),
    };
  });

  return (
    <Animated.View style={[styles.card, { width }, animated]}>
      <View style={styles.cardTop}>
        <Emblem id={plan.id} color={plan.color} />
        <AppText variant="title" align="center" style={styles.planName}>
          {plan.name}
        </AppText>
        <View style={styles.priceRow}>
          <AppText variant="headline">{plan.price}</AppText>
          {plan.period && (
            <AppText variant="footnote" tone="secondary">
              {' '}
              {plan.period}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Emblem id={plan.id} color={plan.color} size={12} />
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.features}>
        {plan.features.map((f) => (
          <View key={f.label} style={styles.feature}>
            <View style={[styles.mark, f.included ? styles.markOn : styles.markOff]}>
              {f.included ? (
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <X size={10} color="#FFFFFF" strokeWidth={3} />
              )}
            </View>
            <AppText variant="subhead" weight="500" tone={f.included ? 'primary' : 'tertiary'}>
              {f.label}
            </AppText>
          </View>
        ))}
      </View>

      <Button
        label={current ? 'Current plan' : plan.id === 'free' ? 'Switch to Free' : `Subscribe to ${plan.name}`}
        size="large"
        disabled={current}
        onPress={() => onSubscribe(plan)}
        style={styles.subscribe}
      />
    </Animated.View>
  );
}

export function PlansScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { planId } = useAccount();
  const cardWidth = Math.min(320, Math.round(screenWidth * 0.76));
  const step = cardWidth + GAP;
  const sidePadding = (Math.min(screenWidth, 760) - cardWidth) / 2;
  const initial = Math.max(
    0,
    plans.findIndex((p) => p.id === 'plus'),
  );
  const scrollX = useSharedValue(initial * step);
  const [active, setActive] = useState(initial);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  return (
    <View style={styles.screen}>
      <PlanWaves colors={plans.map((p) => p.color)} scrollX={scrollX} step={step} />
      <ScreenHeader />
      <View style={styles.body}>
        <Animated.ScrollView
          ref={scrollRef}
          onLayout={() => scrollRef.current?.scrollTo({ x: initial * step, animated: false })}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          decelerationRate="fast"
          disableIntervalMomentum
          contentOffset={{ x: initial * step, y: 0 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / step))}
          onScrollEndDrag={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / step))}
          contentContainerStyle={{ paddingHorizontal: sidePadding, gap: GAP, alignItems: 'center' }}
          style={styles.carousel}
        >
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              width={cardWidth}
              scrollX={scrollX}
              current={plan.id === planId}
              onSubscribe={() => router.push({ pathname: '/checkout/[plan]', params: { plan: plan.id } })}
            />
          ))}
        </Animated.ScrollView>

        <View style={styles.dots} accessibilityLabel={`Plan ${active + 1} of ${plans.length}`}>
          {plans.map((p, i) => (
            <View key={p.id} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  body: { flex: 1, justifyContent: 'center', paddingBottom: spacing.xxxl },
  carousel: { flexGrow: 0, maxWidth: 760, width: '100%', alignSelf: 'center' },
  card: {
    borderRadius: radius.xl + 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background.primary,
    padding: spacing.xxl,
    marginVertical: 40,
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOpacity: 0.07, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 3 },
      default: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.07)' } as object,
    }),
  },
  cardTop: { alignItems: 'center', paddingTop: spacing.sm },
  planName: { fontFamily: serif, fontWeight: '500', fontSize: 30, lineHeight: 36, marginTop: spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: spacing.xxl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  features: { gap: 14 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  markOn: { backgroundColor: colors.ink },
  markOff: { backgroundColor: colors.text.tertiary },
  subscribe: { marginTop: spacing.xxxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.ink },
});
