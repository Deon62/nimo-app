import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import type { Agent } from '@/data/agents';
import { useStories } from '@/state/StoriesContext';
import { colors, screenPadding } from '@/theme';
import { AgentAvatar } from './AgentAvatar';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const COUNT = 5;
const MAX_CONTENT = 680;
const MIN_GAP = 10;

/** Status-style row of five agents that always fits the screen width. */
export function AgentStories({ agents }: { agents: Agent[] }) {
  const { seen } = useStories();
  const { width } = useWindowDimensions();
  const available = Math.min(width, MAX_CONTENT) - screenPadding * 2;
  const ring = Math.min(76, Math.floor((available - MIN_GAP * (COUNT - 1)) / COUNT));
  const avatar = ring - 10;

  return (
    <View style={styles.row}>
      {agents.slice(0, COUNT).map((agent) => {
        const viewed = seen.has(agent.id);
        return (
          <PressableScale
            key={agent.id}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: agent.id } })}
            accessibilityLabel={`${agent.name}, ${agent.role}${viewed ? ', viewed' : ''}`}
            activeScale={0.94}
            style={[styles.item, { width: ring }]}
          >
            <View
              style={[
                styles.ring,
                { width: ring, height: ring, borderRadius: ring / 2 },
                viewed ? styles.ringSeen : [styles.ringNew, { borderColor: agent.tone.foreground }],
              ]}
            >
              <AgentAvatar agent={agent} size={avatar} />
            </View>
            <AppText
              variant="caption"
              weight={viewed ? '400' : '500'}
              tone={viewed ? 'secondary' : 'primary'}
              numberOfLines={1}
              style={styles.name}
            >
              {agent.name}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: screenPadding },
  item: { alignItems: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringNew: { borderWidth: 2.5 },
  ringSeen: { borderWidth: 1.5, borderColor: colors.border },
  name: { marginTop: 6 },
});
