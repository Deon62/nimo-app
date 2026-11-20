import { memo, useEffect, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, RadialGradient, Stop } from 'react-native-svg';

import type { AvatarTone } from '@/data/agents';
import type { CallPhase } from '@/hooks/useMockCall';
import { mix } from '@/utils/color';

/** How the bubble moves in each state: swirl speed (deg/s), pulse depth and rate, resting scale. */
const MOTION: Record<CallPhase | 'muted', { spin: number; depth: number; rate: number; scale: number; glow: number }> =
  {
    speaking: { spin: 60, depth: 0.045, rate: 5.5, scale: 1, glow: 1 },
    listening: { spin: 22, depth: 0.02, rate: 2, scale: 0.96, glow: 0.7 },
    thinking: { spin: 90, depth: 0.012, rate: 1.4, scale: 0.93, glow: 0.55 },
    connecting: { spin: 14, depth: 0.03, rate: 1.6, scale: 0.9, glow: 0.4 },
    muted: { spin: 6, depth: 0, rate: 1, scale: 0.92, glow: 0.25 },
    ended: { spin: 0, depth: 0, rate: 1, scale: 0.86, glow: 0 },
  };

const EASE = { duration: 700, easing: Easing.inOut(Easing.cubic) };

interface VoiceOrbProps {
  phase: CallPhase;
  muted?: boolean;
  tone: AvatarTone;
  /** Overall footprint including the glow and dotted halo. */
  size?: number;
  /** Colour of the halo dots; match the surface (light dots on dark screens). */
  dotColor?: string;
  /** Hide the dotted halo (useful at small sizes). */
  halo?: boolean;
}

/** Dotted ring that fades in near the sphere and out towards the edge. */
const DotHalo = memo(function DotHalo({ size, inner, color }: { size: number; inner: number; color: string }) {
  const dots = useMemo(() => {
    const out: { x: number; y: number; o: number }[] = [];
    const gap = Math.max(5, size / 34);
    const c = size / 2;
    const outer = size / 2;
    for (let y = gap / 2; y < size; y += gap) {
      for (let x = gap / 2; x < size; x += gap) {
        const d = Math.hypot(x - c, y - c);
        if (d < inner || d > outer) continue;
        const t = (d - inner) / (outer - inner);
        out.push({ x, y, o: Math.pow(1 - t, 1.6) * 0.55 });
      }
    }
    return out;
  }, [size, inner]);
  const r = Math.max(0.7, size / 260);
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={r} fill={color} opacity={d.o} />
      ))}
    </Svg>
  );
});

/** Glossy marbled sphere that swirls and breathes with the conversation. */
export function VoiceOrb({ phase, muted, tone, size = 220, dotColor = '#FFFFFF', halo = true }: VoiceOrbProps) {
  const mode = muted && phase !== 'ended' ? 'muted' : phase;
  const uid = `orb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const sphere = Math.round(size * (halo ? 0.56 : 0.86));

  const light = mix(tone.background, '#FFFFFF', 0.55);
  const mid = mix(tone.background, tone.foreground, 0.45);
  const deep = tone.foreground;
  const glowColor = mix(tone.foreground, tone.background, 0.4);

  const spin = useSharedValue(MOTION[mode].spin);
  const depth = useSharedValue(MOTION[mode].depth);
  const rate = useSharedValue(MOTION[mode].rate);
  const base = useSharedValue(MOTION[mode].scale);
  const glow = useSharedValue(MOTION[mode].glow);
  const angle = useSharedValue(0);
  const clock = useSharedValue(0);

  useEffect(() => {
    const m = MOTION[mode];
    spin.set(withTiming(m.spin, EASE));
    depth.set(withTiming(m.depth, EASE));
    rate.set(withTiming(m.rate, EASE));
    base.set(withTiming(m.scale, EASE));
    glow.set(withTiming(m.glow, EASE));
  }, [mode, spin, depth, rate, base, glow]);

  useFrameCallback((frame) => {
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    angle.set((angle.get() + spin.get() * dt) % 360);
    clock.set(clock.get() + dt * rate.get());
  });

  const sphereStyle = useAnimatedStyle(() => {
    // Two overlapping sines make speaking feel irregular, like a voice.
    const c = clock.get();
    const wobble = Math.sin(c) * 0.65 + Math.sin(c * 2.3 + 1) * 0.35;
    return { transform: [{ scale: base.get() + depth.get() * wobble }] };
  });
  const swirlStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));
  const counterStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-angle.get() * 0.6}deg` }] }));
  const glowStyle = useAnimatedStyle(() => {
    const c = clock.get();
    return { opacity: glow.get() * (0.85 + 0.15 * Math.sin(c * 0.8)), transform: [{ scale: 0.95 + glow.get() * 0.1 }] };
  });

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {halo && <DotHalo size={size} inner={sphere * 0.5} color={dotColor} />}

      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={`${uid}orbGlow`} cx="50%" cy="50%" r="50%">
              <Stop offset="0.35" stopColor={glowColor} stopOpacity={0.55} />
              <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={Math.min(size / 2, sphere * 0.82)} fill={`url(#${uid}orbGlow)`} />
        </Svg>
      </Animated.View>

      <View style={styles.center}>
        <Animated.View
          style={[{ width: sphere, height: sphere, borderRadius: sphere / 2, overflow: 'hidden' }, sphereStyle]}
        >
          {/* Base body */}
          <Svg width={sphere} height={sphere} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id={`${uid}orbBody`} cx="38%" cy="32%" r="75%">
                <Stop offset="0" stopColor={light} />
                <Stop offset="0.55" stopColor={mid} />
                <Stop offset="1" stopColor={deep} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill={`url(#${uid}orbBody)`} />
          </Svg>

          {/* Marbled streaks, rotating in opposite directions */}
          <Animated.View style={[StyleSheet.absoluteFill, swirlStyle]}>
            <Svg width={sphere} height={sphere} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id={`${uid}streakLight`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id={`${uid}streakDeep`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={deep} stopOpacity={0.7} />
                  <Stop offset="1" stopColor={deep} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <G transform="rotate(-28 50 50)">
                <Ellipse cx="46" cy="40" rx="48" ry="11" fill={`url(#${uid}streakLight)`} />
                <Ellipse cx="58" cy="66" rx="40" ry="9" fill={`url(#${uid}streakLight)`} opacity={0.7} />
                <Ellipse cx="50" cy="54" rx="44" ry="10" fill={`url(#${uid}streakDeep)`} />
              </G>
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, counterStyle]}>
            <Svg width={sphere} height={sphere} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id={`${uid}streakSoft`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={light} stopOpacity={0.9} />
                  <Stop offset="1" stopColor={light} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <G transform="rotate(35 50 50)">
                <Ellipse cx="40" cy="62" rx="36" ry="12" fill={`url(#${uid}streakSoft)`} />
                <Ellipse cx="66" cy="30" rx="26" ry="8" fill={`url(#${uid}streakSoft)`} opacity={0.8} />
              </G>
            </Svg>
          </Animated.View>

          {/* Glass: rim shading and a soft highlight */}
          <Svg width={sphere} height={sphere} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id={`${uid}orbRim`} cx="50%" cy="50%" r="50%">
                <Stop offset="0.7" stopColor={deep} stopOpacity={0} />
                <Stop offset="1" stopColor={deep} stopOpacity={0.45} />
              </RadialGradient>
              <RadialGradient id={`${uid}orbShine`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill={`url(#${uid}orbRim)`} />
            <Ellipse cx="36" cy="27" rx="20" ry="12" fill={`url(#${uid}orbShine)`} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
