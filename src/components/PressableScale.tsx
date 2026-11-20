import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale applied while pressed. */
  activeScale?: number;
  activeOpacity?: number;
}

/** A pressable with a restrained, iOS-like press response. */
export function PressableScale({
  style,
  activeScale = 0.97,
  activeOpacity = 0.85,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * (1 - activeOpacity),
    transform: [{ scale: 1 - pressed.value * (1 - activeScale) }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 180 });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
