import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Play } from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Agent } from '@/data/agents';
import { useVoicePreview } from '@/state/VoicePreviewContext';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

function MiniBar({ delay, color }: { delay: number; color: string }) {
  const level = useSharedValue(0.3);
  useEffect(() => {
    level.set(
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 260, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.3, { duration: 260, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(level);
  }, [delay, level]);
  const style = useAnimatedStyle(() => ({ height: 4 + level.get() * 10 }));
  return <Animated.View style={[styles.miniBar, { backgroundColor: color }, style]} />;
}

interface VoicePreviewButtonProps {
  agent: Agent;
  /** `dark` for use on charcoal surfaces. */
  appearance?: 'light' | 'dark';
  size?: 'regular' | 'large';
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export function VoicePreviewButton({
  agent,
  appearance = 'light',
  size = 'regular',
  style,
  label = 'Listen',
}: VoicePreviewButtonProps) {
  const { playingId, toggle } = useVoicePreview();
  const playing = playingId === agent.id;
  const dark = appearance === 'dark';
  const ink = dark ? '#FFFFFF' : colors.ink;

  return (
    <PressableScale
      onPress={() => toggle(agent)}
      accessibilityLabel={playing ? `Stop ${agent.name}'s voice` : `Listen to ${agent.name}'s voice`}
      accessibilityState={{ selected: playing }}
      style={[
        styles.button,
        size === 'large' ? styles.large : styles.regular,
        { borderColor: dark ? 'rgba(255, 255, 255, 0.28)' : colors.border },
        style,
      ]}
    >
      <View style={styles.iconSlot}>
        {playing ? (
          <View style={styles.bars}>
            {[0, 120, 60].map((d) => (
              <MiniBar key={d} delay={d} color={ink} />
            ))}
          </View>
        ) : (
          <Play size={14} color={ink} fill={ink} strokeWidth={1.5} />
        )}
      </View>
      <AppText variant={size === 'large' ? 'headline' : 'subhead'} weight="600" style={{ color: ink }}>
        {playing ? 'Playing' : label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
  },
  regular: { minHeight: 40 },
  large: { minHeight: 54, paddingHorizontal: 22 },
  iconSlot: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 16 },
  miniBar: { width: 2.5, borderRadius: 1.25 },
});
