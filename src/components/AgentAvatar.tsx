import { Image, StyleSheet, Text, View } from 'react-native';

import type { Agent } from '@/data/agents';
import { AgentPortrait } from './AgentPortrait';
import { colors, fontFamily } from '@/theme';

export interface AgentAvatarProps {
  agent: Pick<Agent, 'name' | 'tone' | 'availability' | 'portrait'>;
  size?: number;
  showStatus?: boolean;
  /** Ring colour around the status dot; match the surface behind the avatar. */
  surfaceColor?: string;
}

const statusColor = {
  available: colors.accent.success,
  busy: '#FF9F0A',
  offline: colors.text.tertiary,
} as const;

/** Illustrated portrait avatar on the agent's tone. */
export function AgentAvatar({
  agent,
  size = 48,
  showStatus = false,
  surfaceColor = colors.background.primary,
}: AgentAvatarProps) {
  const dot = Math.max(10, Math.round(size * 0.24));
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: agent.tone.background },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AgentPortrait portrait={agent.portrait} background={agent.tone.background} size={size} />
      {showStatus && (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              borderColor: surfaceColor,
              borderWidth: Math.max(2, dot * 0.18),
              backgroundColor: statusColor[agent.availability],
              right: size * 0.02,
              bottom: size * 0.02,
            },
          ]}
        />
      )}
    </View>
  );
}

/** The user's photo, or their initial when no photo has been set. */
export function UserAvatar({ name, uri, size = 36 }: { name: string; uri?: string | null; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.dark.surface, overflow: 'hidden' },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <Text allowFontScaling={false} style={[styles.initial, { color: '#FFFFFF', fontSize: size * 0.4 }]}>
          {name.charAt(0)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily,
    fontWeight: '500',
    includeFontPadding: false,
  },
  dot: {
    position: 'absolute',
  },
});
