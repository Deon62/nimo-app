import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { Search, X } from 'lucide-react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, fontFamily, hitTarget, radius } from '@/theme';
import { AppText } from './AppText';

const HEIGHT = 56;
const ICON_BOX = hitTarget;
const TIMING = { duration: 320, easing: Easing.out(Easing.cubic) };

interface HeaderSearchProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  inputRef?: RefObject<TextInputInstance | null>;
  /** Extra icon buttons shown to the right (they stay visible while searching). */
  trailing?: ReactNode;
}

/**
 * Large screen title with a search icon. Tapping the icon grows a search field
 * out of it, sweeping over the title; closing shrinks it back into the icon.
 */
export function HeaderSearch({
  title,
  open,
  onOpenChange,
  value,
  onChangeText,
  placeholder,
  inputRef: externalRef,
  trailing,
}: HeaderSearchProps) {
  const localRef = useRef<TextInputInstance>(null);
  const inputRef = externalRef ?? localRef;
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(open ? 1 : 0, TIMING));
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    inputRef.current?.blur();
  }, [open, progress, inputRef]);

  const barStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.get(), [0, 1], [ICON_BOX, Math.max(width, ICON_BOX)]),
    opacity: interpolate(progress.get(), [0, 0.15, 1], [0, 1, 1]),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 0.5], [1, 0], 'clamp'),
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [0, -16]) }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0, 0.3], [1, 0], 'clamp') }));
  const fieldStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0.4, 1], [0, 1], 'clamp') }));

  const close = () => {
    onChangeText('');
    onOpenChange(false);
  };

  return (
    <View style={styles.row}>
      <View style={styles.area} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents={open ? 'none' : 'auto'}>
          <AppText variant="largeTitle" accessibilityRole="header" numberOfLines={1}>
            {title}
          </AppText>
        </Animated.View>

        <Animated.View style={[styles.iconWrap, iconStyle]} pointerEvents={open ? 'none' : 'auto'}>
          <Pressable
            onPress={() => onOpenChange(true)}
            accessibilityRole="button"
            accessibilityLabel={`Search ${title}`}
            style={styles.iconButton}
          >
            <Search size={23} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.bar, barStyle]} pointerEvents={open ? 'auto' : 'none'}>
          <Animated.View style={[styles.field, fieldStyle]}>
            <Search size={20} color={colors.ink} strokeWidth={1.8} />
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.text.secondary}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              selectionColor={colors.ink}
              accessibilityLabel={placeholder}
              style={styles.input}
            />
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close search">
              <X size={20} color={colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  area: { flex: 1, height: HEIGHT, justifyContent: 'center' },
  titleWrap: { paddingRight: ICON_BOX },
  iconWrap: { position: 'absolute', right: 0, top: (HEIGHT - ICON_BOX) / 2 },
  iconButton: { width: ICON_BOX, height: ICON_BOX, alignItems: 'center', justifyContent: 'center' },
  bar: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.background.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D8DE',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 1 },
      default: { boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)' } as object,
    }),
  },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18 },
  input: {
    flex: 1,
    fontFamily,
    fontSize: 17,
    color: colors.text.primary,
    paddingVertical: 0,
    height: HEIGHT,
    outlineStyle: 'none',
  } as object,
});
