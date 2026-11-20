import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Agent } from '@/data/agents';
import { colors, radius, spacing } from '@/theme';
import { AgentAvatar } from './AgentAvatar';
import { AppText } from './AppText';
import { CallIconButton } from './CallIconButton';
import { PressableScale } from './PressableScale';

interface AgentCardProps {
  agent: Agent;
  onPress: () => void;
  onCall: () => void;
  /** `row` for lists, `tile` for the two-column grid on wider screens. */
  variant?: 'row' | 'tile';
  style?: StyleProp<ViewStyle>;
}

export function AgentCard({ agent, onPress, onCall, variant = 'row', style }: AgentCardProps) {
  const label = `${agent.name}, ${agent.role}`;

  if (variant === 'tile') {
    return (
      <View style={[styles.tileWrap, style]}>
        <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.tile} activeScale={0.98}>
          <AgentAvatar agent={agent} size={56} showStatus />
          <View style={styles.tileText}>
            <AppText variant="headline" numberOfLines={1}>
              {agent.name}
            </AppText>
            <AppText variant="footnote" tone="secondary" numberOfLines={1}>
              {agent.role}
            </AppText>
          </View>
        </PressableScale>
        <View style={styles.tileCall}>
          <CallIconButton agent={agent} onPress={onCall} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.rowMain} activeScale={0.985}>
        <AgentAvatar agent={agent} size={48} showStatus />
        <View style={styles.rowText}>
          <AppText variant="headline" numberOfLines={1}>
            {agent.name}
          </AppText>
          <AppText variant="footnote" tone="secondary" numberOfLines={1}>
            {agent.role}
          </AppText>
        </View>
      </PressableScale>
      <CallIconButton agent={agent} onPress={onCall} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2 },
  rowText: { flex: 1, gap: 1 },
  tileWrap: { flex: 1 },
  tileCall: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  tile: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background.primary,
    gap: spacing.md,
  },
  tileText: { gap: 1 },
});
