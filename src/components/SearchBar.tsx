import { useRef, type RefObject } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
  type TextInputInstance,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { colors, fontFamily, radius } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  /** Render as a non-editable button (e.g. on Home, to jump to Explore). */
  onPressWhenReadOnly?: () => void;
  inputRef?: RefObject<TextInputInstance | null>;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  style,
  onPressWhenReadOnly,
  inputRef: externalRef,
  autoFocus,
}: SearchBarProps) {
  const localRef = useRef<TextInputInstance>(null);
  const inputRef = externalRef ?? localRef;
  const readOnly = !!onPressWhenReadOnly;

  return (
    <Pressable
      onPress={readOnly ? onPressWhenReadOnly : () => inputRef.current?.focus()}
      accessibilityRole={readOnly ? 'search' : undefined}
      accessibilityLabel={readOnly ? placeholder : undefined}
      style={[styles.container, style]}
    >
      <Search size={20} color={colors.ink} strokeWidth={1.8} />
      <View style={styles.inputWrap} pointerEvents={readOnly ? 'none' : 'auto'}>
        <TextInput
          ref={inputRef}
          autoFocus={autoFocus}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          editable={!readOnly}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          selectionColor={colors.ink}
          accessibilityLabel={placeholder}
          style={styles.input}
        />
      </View>
      {value.length > 0 && !readOnly && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clear}
        >
          <X size={11} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.background.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D8DE',
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 1 },
      default: { boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)' } as object,
    }),
  },
  inputWrap: { flex: 1 },
  input: {
    fontFamily,
    fontSize: 17,
    color: colors.text.primary,
    paddingVertical: 0,
    height: 56,
    // Removes the focus outline on web.
    outlineStyle: 'none',
  } as object,
  clear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
