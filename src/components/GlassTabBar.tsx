import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { House, Phone, UserRound, UsersRound } from 'lucide-react-native';
import type { ComponentType } from 'react';

import { useTabBarBottomOffset } from '@/hooks/useTabBarInset';
import { colors, tabBar } from '@/theme';
import { OngoingCallBar } from './OngoingCallBar';

type TabIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const icons: Record<string, TabIcon> = {
  index: House,
  explore: UsersRound,
  calls: Phone,
  profile: UserRound,
};

const BAR_WIDTH = tabBar.width;

/**
 * Floating, translucent tab bar. Uses native material blur on iOS and web;
 * Android falls back to a frosted translucent surface (real blur on Android
 * requires wrapping content in a BlurTargetView).
 */
export function GlassTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const bottomOffset = useTabBarBottomOffset();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <OngoingCallBar />
      <View style={styles.shadow}>
        <View style={styles.bar} accessibilityRole="tablist">
          <BlurView
            intensity={Platform.OS === 'ios' ? 80 : 40}
            tint="systemChromeMaterialLight"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.frost]} />

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label = typeof options.title === 'string' ? options.title : route.name;
            const Icon = icons[route.name] ?? House;
            const tint = focused ? colors.ink : colors.text.tertiary;

            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={styles.item}
              >
                {({ pressed }) => (
                  <View style={[styles.itemInner, { opacity: pressed ? 0.5 : 1 }]}>
                    <View style={[styles.activeDot, { opacity: focused ? 1 : 0 }]} />
                    <Icon size={23} color={tint} strokeWidth={focused ? 2.1 : 1.8} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: tabBar.horizontalMargin,
    right: tabBar.horizontalMargin,
    alignItems: 'center',
    gap: 10,
  },
  shadow: {
    width: BAR_WIDTH,
    borderRadius: tabBar.height / 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
      default: { boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08)' } as object,
    }),
  },
  bar: {
    height: tabBar.height,
    borderRadius: tabBar.height / 2,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  frost: {
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.35)',
      android: 'rgba(250, 250, 250, 0.94)',
      default: 'rgba(255, 255, 255, 0.62)',
    }),
  },
  activeDot: {
    position: 'absolute',
    bottom: -11,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    gap: 3,
  },
});
