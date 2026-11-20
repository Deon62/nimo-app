import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { PhoneOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { getAgent } from '@/data/agents';
import { useActiveCall } from '@/state/ActiveCallContext';
import { colors, fontFamily, tabBar } from '@/theme';
import { formatDuration } from '@/utils/format';
import { AgentAvatar } from './AgentAvatar';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const phaseLabel = {
  connecting: 'Connecting…',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  ended: 'Call ended',
} as const;

/** Compact "return to call" bar shown above the tab bar while a call is minimised. */
export function OngoingCallBar() {
  const { call, end } = useActiveCall();
  const agent = getAgent(call?.agentId);
  if (!call || !agent || call.phase === 'ended') return null;

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(200)} style={styles.wrap}>
      <View style={styles.bar}>
        <PressableScale
          onPress={() => router.push('/call')}
          accessibilityLabel={`Return to call with ${agent.name}`}
          style={styles.main}
          activeScale={0.98}
        >
          <AgentAvatar agent={agent} size={32} />
          <View style={styles.text}>
            <AppText variant="subhead" weight="600" tone="inverse" numberOfLines={1}>
              {agent.name}
            </AppText>
            <AppText variant="caption" style={styles.status} numberOfLines={1}>
              {call.connectedAt ? `${formatDuration(call.elapsedSeconds)} · ` : ''}
              {phaseLabel[call.phase]}
            </AppText>
          </View>
        </PressableScale>
        <PressableScale onPress={end} hitSlop={8} accessibilityLabel="End call" style={styles.end} activeScale={0.9}>
          <PhoneOff size={16} color="#FFFFFF" strokeWidth={2.2} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: tabBar.width },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 28,
    backgroundColor: colors.dark.surface,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  text: { flex: 1 },
  status: { color: colors.dark.textSecondary, fontFamily, fontVariant: ['tabular-nums'] },
  end: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
