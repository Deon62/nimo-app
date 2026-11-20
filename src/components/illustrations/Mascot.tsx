import { useEffect, useId } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

interface MascotProps {
  size?: number;
  /** Raises a little hand to wave. */
  waving?: boolean;
  /** Gentle up-and-down float. */
  float?: boolean;
}

/** Nimo's mascot: a soft, smiling voice orb with a little antenna. */
export function MascotArt({ waving = false, idPrefix }: { waving?: boolean; idPrefix: string }) {
  const body = `${idPrefix}body`;
  return (
    <G>
      <Defs>
        <RadialGradient id={body} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#E4EDFF" />
          <Stop offset="0.55" stopColor="#A9C2FA" />
          <Stop offset="1" stopColor="#7F9DF0" />
        </RadialGradient>
      </Defs>
      {/* antenna */}
      <Path d="M100 34 Q104 20 114 16" stroke="#7F9DF0" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx="116" cy="15" r="7" fill="#7DCB9E" />
      {/* body */}
      <Circle cx="100" cy="104" r="70" fill={`url(#${body})`} />
      <Ellipse cx="74" cy="70" rx="20" ry="12" fill="#FFFFFF" opacity={0.55} transform="rotate(-28 74 70)" />
      {/* eyes */}
      <Ellipse cx="80" cy="104" rx="6.5" ry="8.5" fill="#1F2340" />
      <Ellipse cx="120" cy="104" rx="6.5" ry="8.5" fill="#1F2340" />
      <Circle cx="82.5" cy="100.5" r="2.4" fill="#FFFFFF" />
      <Circle cx="122.5" cy="100.5" r="2.4" fill="#FFFFFF" />
      {/* cheeks */}
      <Ellipse cx="66" cy="122" rx="10" ry="6" fill="#FF98B0" opacity={0.55} />
      <Ellipse cx="134" cy="122" rx="10" ry="6" fill="#FF98B0" opacity={0.55} />
      {/* smile */}
      <Path d="M90 122 Q100 132 110 122" stroke="#1F2340" strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* arms */}
      {waving ? (
        <Path d="M164 96 Q178 78 172 62" stroke="#8EABF4" strokeWidth={11} strokeLinecap="round" fill="none" />
      ) : (
        <Path d="M166 118 Q176 132 168 144" stroke="#8EABF4" strokeWidth={11} strokeLinecap="round" fill="none" />
      )}
      <Path d="M34 118 Q24 132 32 144" stroke="#8EABF4" strokeWidth={11} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function Mascot({ size = 120, waving = false, float = true }: MascotProps) {
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const y = useSharedValue(0);

  useEffect(() => {
    if (!float) return;
    y.set(
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [float, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]} accessibilityElementsHidden>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <MascotArt waving={waving} idPrefix={id} />
      </Svg>
    </Animated.View>
  );
}
