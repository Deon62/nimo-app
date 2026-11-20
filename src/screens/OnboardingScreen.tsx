import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { AnytimeArt, TalkArt, VoicesArt } from '@/components/illustrations/OnboardingArt';
import { useAuth } from '@/state/AuthContext';
import { colors, screenPadding, spacing } from '@/theme';

const SLIDES = [
  { key: 'talk', Art: TalkArt, title: 'Say hi to Nimo', body: 'Real voice calls with AI that listens.' },
  { key: 'voices', Art: VoicesArt, title: 'Ten friendly voices', body: 'Pick who to talk to, for any topic.' },
  { key: 'anytime', Art: AnytimeArt, title: 'Here day and night', body: 'Call anytime. Your calls stay private.' },
] as const;

function Dot({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(progress.get() - index);
    return {
      width: interpolate(d, [0, 1], [22, 7], Extrapolation.CLAMP),
      opacity: interpolate(d, [0, 1], [1, 0.25], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function Slide({
  width,
  index,
  progress,
  children,
}: {
  width: number;
  index: number;
  progress: SharedValue<number>;
  children: React.ReactNode;
}) {
  // Text drifts and fades as the slide scrolls, so swiping feels soft.
  const textStyle = useAnimatedStyle(() => {
    const d = progress.get() - index;
    return {
      opacity: interpolate(Math.abs(d), [0, 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(d, [-1, 0, 1], [60, 0, -60], Extrapolation.CLAMP) }],
    };
  });
  const [art, text] = children as [React.ReactNode, React.ReactNode];
  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.art}>{art}</View>
      <Animated.View style={[styles.text, textStyle]}>{text}</Animated.View>
    </View>
  );
}

export function OnboardingScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { finishOnboarding } = useAuth();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const progress = useSharedValue(0);
  const [page, setPage] = useState(0);
  const pageSV = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    const p = e.contentOffset.x / Math.max(1, e.layoutMeasurement.width);
    progress.set(p);
    const rounded = Math.round(p);
    if (rounded !== pageSV.get()) {
      pageSV.set(rounded);
      scheduleOnRN(setPage, rounded);
    }
  });

  const last = page === SLIDES.length - 1;
  const artWidth = Math.min(width - screenPadding * 2, 340);

  const next = () => {
    if (last) finishOnboarding();
    else scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  };

  return (
    <View style={[styles.screen, { paddingTop: top, paddingBottom: bottom + spacing.lg }]}>
      <View style={styles.topBar}>
        {!last && (
          <Pressable onPress={finishOnboarding} hitSlop={10} accessibilityRole="button">
            <AppText variant="subhead" weight="600" tone="secondary">
              Skip
            </AppText>
          </Pressable>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {SLIDES.map(({ key, Art, title, body }, i) => (
          <Slide key={key} width={width} index={i} progress={progress}>
            <Art width={artWidth} />
            <>
              <AppText variant="largeTitle" align="center">
                {title}
              </AppText>
              <AppText variant="callout" tone="secondary" align="center">
                {body}
              </AppText>
            </>
          </Slide>
        ))}
      </Animated.ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <Dot key={s.key} index={i} progress={progress} />
          ))}
        </View>
        <Button label={last ? 'Get started' : 'Next'} size="large" onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  topBar: { height: 44, paddingHorizontal: screenPadding, alignItems: 'flex-end', justifyContent: 'center' },
  pager: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: screenPadding },
  art: { alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: spacing.xxxl, gap: spacing.sm, maxWidth: 320 },
  bottom: {
    paddingHorizontal: screenPadding,
    gap: spacing.xxl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4, backgroundColor: colors.ink },
});
