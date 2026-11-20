import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { withAlpha } from '@/utils/color';

const HEIGHT = 260;

/** A sine wave that repeats exactly every `width` px, drawn across 2×width so it can loop. */
function wavePath(width: number, baseline: number, amplitude: number, cycles: number, phase: number): string {
  const steps = 64;
  const total = width * 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = (total * i) / steps;
    const y = baseline + amplitude * Math.sin((x / width) * cycles * Math.PI * 2 + phase);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `${d}L${total} ${HEIGHT} L0 ${HEIGHT} Z`;
}

const LAYERS = [
  { baseline: 70, amplitude: 16, cycles: 1, phase: 0, alpha: 0.16, duration: 14000, reverse: false },
  { baseline: 120, amplitude: 14, cycles: 2, phase: 1.4, alpha: 0.26, duration: 10000, reverse: true },
  { baseline: 170, amplitude: 12, cycles: 1, phase: 2.6, alpha: 0.42, duration: 8000, reverse: false },
];

function Layer({
  color,
  index,
  step,
  scrollX,
  drifts,
  width,
}: {
  color: string;
  index: number;
  step: number;
  scrollX: SharedValue<number>;
  drifts: SharedValue<number>[];
  width: number;
}) {
  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.get() / step, [index - 1, index, index + 1], [0, 1, 0], 'clamp'),
  }));
  const paths = useMemo(() => LAYERS.map((l) => wavePath(width, l.baseline, l.amplitude, l.cycles, l.phase)), [width]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, fade]}>
      {LAYERS.map((l, i) => (
        <Drifting key={i} drift={drifts[i]} width={width} reverse={l.reverse}>
          <Svg width={width * 2} height={HEIGHT}>
            <Path d={paths[i]} fill={withAlpha(color, l.alpha)} />
          </Svg>
        </Drifting>
      ))}
    </Animated.View>
  );
}

function Drifting({
  drift,
  width,
  reverse,
  children,
}: {
  drift: SharedValue<number>;
  width: number;
  reverse: boolean;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: reverse ? -width + drift.get() * width : -drift.get() * width }],
  }));
  return <Animated.View style={[styles.layer, { width: width * 2 }, style]}>{children}</Animated.View>;
}

interface PlanWavesProps {
  /** One colour per plan, in carousel order. */
  colors: string[];
  /** Carousel scroll offset and page width, used to cross-fade between plan colours. */
  scrollX: SharedValue<number>;
  step: number;
}

/** Slow, layered waves along the bottom of the screen, tinted by the plan in view. */
export function PlanWaves({ colors, scrollX, step }: PlanWavesProps) {
  const { width } = useWindowDimensions();
  const d0 = useSharedValue(0);
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);

  useEffect(() => {
    const drifts = [d0, d1, d2];
    drifts.forEach((d, i) =>
      d.set(withRepeat(withTiming(1, { duration: LAYERS[i].duration, easing: Easing.linear }), -1, false)),
    );
    return () => drifts.forEach((d) => cancelAnimation(d));
  }, [d0, d1, d2]);

  return (
    <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden>
      {colors.map((color, i) => (
        <Layer key={i} color={color} index={i} step={step} scrollX={scrollX} drifts={[d0, d1, d2]} width={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: HEIGHT, overflow: 'hidden' },
  layer: { position: 'absolute', left: 0, bottom: 0, height: HEIGHT },
});
