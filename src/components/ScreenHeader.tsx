import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, hitTarget, screenPadding } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface ScreenHeaderProps {
  title?: string;
  /** `back` for pushed screens, `close` for modals. */
  mode?: 'back' | 'close';
  backLabel?: string;
  right?: ReactNode;
  /** Modals already sit below the status bar on iOS. */
  respectTopInset?: boolean;
  bordered?: boolean;
}

/** Goes back, or to `fallback` when the screen was opened directly (e.g. from a link). */
export function goBackOr(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

export function ScreenHeader({
  title,
  mode = 'back',
  backLabel = 'Back',
  right,
  respectTopInset = true,
  bordered = false,
}: ScreenHeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: respectTopInset ? top : 8 }, bordered && styles.bordered]}>
      <View style={styles.side}>
        {mode === 'back' ? (
          <PressableScale
            onPress={() => goBackOr()}
            accessibilityLabel={backLabel}
            style={styles.back}
            activeScale={1}
            activeOpacity={0.4}
          >
            <ArrowLeft size={24} color={colors.ink} strokeWidth={1.9} />
          </PressableScale>
        ) : (
          <PressableScale onPress={() => goBackOr()} accessibilityLabel="Close" style={styles.close} activeScale={0.92}>
            <X size={22} color={colors.ink} strokeWidth={1.9} />
          </PressableScale>
        )}
      </View>
      <View style={styles.titleWrap} pointerEvents="none">
        {title ? (
          <AppText variant="headline" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: screenPadding - 8,
    paddingBottom: 6,
    backgroundColor: colors.background.primary,
  },
  bordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: { flex: 1, minHeight: hitTarget, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  titleWrap: { flex: 2, minHeight: hitTarget, alignItems: 'center', justifyContent: 'center' },
  back: { width: hitTarget, minHeight: hitTarget, justifyContent: 'center', paddingLeft: 8 },
  close: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
