import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Check, ChevronRight, type LucideIcon } from 'lucide-react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

interface BaseProps {
  label: string;
  icon?: LucideIcon;
  detail?: string;
}

type ListRowProps = BaseProps &
  (
    | { type: 'link'; onPress: () => void; value?: string; destructive?: boolean }
    | { type: 'toggle'; value: boolean; onValueChange: (value: boolean) => void }
    | { type: 'value'; value: string }
    | { type: 'check'; checked: boolean; onPress: () => void }
  );

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <View style={styles.iconBox}>
      <Icon size={20} color={colors.ink} strokeWidth={1.6} />
    </View>
  );
}

export function ListRow(props: ListRowProps) {
  const { label, icon, detail } = props;
  const destructive = props.type === 'link' && props.destructive;

  const content = (trailing: ReactNode, pressed = false) => (
    <View style={[styles.row, pressed && styles.pressed]}>
      {icon && <RowIcon icon={icon} />}
      <View style={styles.text}>
        <AppText variant="body" tone={destructive ? 'danger' : 'primary'} numberOfLines={1}>
          {label}
        </AppText>
        {detail && (
          <AppText variant="footnote" tone="secondary" numberOfLines={2}>
            {detail}
          </AppText>
        )}
      </View>
      {trailing}
    </View>
  );

  switch (props.type) {
    case 'toggle':
      return (
        <Pressable
          onPress={() => props.onValueChange(!props.value)}
          accessibilityRole="switch"
          accessibilityLabel={label}
          accessibilityState={{ checked: props.value }}
        >
          {content(
            <Switch
              value={props.value}
              onValueChange={props.onValueChange}
              trackColor={{ true: colors.ink, false: colors.border }}
              thumbColor="#FFFFFF"
              {...({ activeThumbColor: '#FFFFFF' } as object)}
              ios_backgroundColor={colors.border}
            />,
          )}
        </Pressable>
      );
    case 'value':
      return content(
        <AppText variant="body" tone="secondary" numberOfLines={1} style={styles.value}>
          {props.value}
        </AppText>,
      );
    case 'check':
      return (
        <Pressable onPress={props.onPress} accessibilityRole="radio" accessibilityState={{ checked: props.checked }}>
          {({ pressed }) =>
            content(props.checked ? <Check size={20} color={colors.ink} strokeWidth={2.2} /> : null, pressed)
          }
        </Pressable>
      );
    case 'link':
      return (
        <Pressable onPress={props.onPress} accessibilityRole="button" accessibilityLabel={label}>
          {({ pressed }) =>
            content(
              <View style={styles.trailing}>
                {props.value && (
                  <AppText variant="body" tone="secondary" numberOfLines={1}>
                    {props.value}
                  </AppText>
                )}
                {!destructive && <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={2.2} />}
              </View>,
              pressed,
            )
          }
        </Pressable>
      );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    minHeight: 54,
  },
  pressed: { opacity: 0.5 },
  iconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 1 },
  value: { maxWidth: '55%' },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
