import { StyleSheet, View } from 'react-native';
import { Phone } from 'lucide-react-native';

import { getAgent } from '@/data/agents';
import type { Idea } from '@/data/ideas';
import { useActiveCall } from '@/state/ActiveCallContext';
import { colors, spacing } from '@/theme';
import { AgentAvatar } from './AgentAvatar';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/**
 * Conversation starters styled as the opening message of a chat:
 * the agent's portrait beside a speech bubble. Tapping one calls that agent.
 */
export function IdeaTiles({ ideas }: { ideas: Idea[] }) {
  const { callAgent } = useActiveCall();
  return (
    <View style={styles.list}>
      {ideas.map((idea) => {
        const agent = getAgent(idea.agentId);
        if (!agent) return null;
        return (
          <PressableScale
            key={idea.id}
            onPress={() => callAgent(agent.id)}
            accessibilityLabel={`${idea.prompt}. Call ${agent.name}`}
            activeScale={0.98}
            style={styles.row}
          >
            <AgentAvatar agent={agent} size={40} />
            <View style={styles.message}>
              <AppText variant="caption" tone="secondary" style={styles.name}>
                {agent.name}
              </AppText>
              <View style={styles.bubble}>
                <AppText variant="callout" weight="500" style={styles.prompt}>
                  {idea.prompt}
                </AppText>
              </View>
            </View>
            <Phone size={18} color={colors.text.tertiary} strokeWidth={1.8} style={styles.phone} />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  message: { flex: 1, alignItems: 'flex-start' },
  name: { marginLeft: 14, marginBottom: 4 },
  bubble: {
    backgroundColor: '#F2F2F4',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  prompt: { color: colors.text.primary },
  phone: { marginBottom: 13 },
});
