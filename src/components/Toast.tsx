import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { colors, fontFamily, radius } from '@/theme';
import { AppText } from './AppText';

/** Lightweight transient message, e.g. for prototype-only actions. */
export function useToast(duration = 2200) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { message, show };
}

export function Toast({ message, bottom }: { message: string | null; bottom: number }) {
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      pointerEvents="none"
      style={[styles.toast, { bottom }]}
      accessibilityLiveRegion="polite"
    >
      <AppText variant="subhead" weight="500" tone="inverse" align="center" style={styles.text}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '86%',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.dark.surface,
  },
  text: { fontFamily },
});
