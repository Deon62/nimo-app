import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MessageSquareText, Share as ShareIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HeaderIconButton } from '@/components/HeaderIconButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getAgent } from '@/data/agents';
import { useCallHistory } from '@/state/CallHistoryContext';
import { colors, radius, screenPadding, spacing } from '@/theme';
import { formatCallDate, formatDuration } from '@/utils/format';

/** A call's conversation as chat bubbles: the agent on the left, you on the right. */
export function TranscriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const { getCall, loadCall } = useCallHistory();
  const record = getCall(id);
  const agent = getAgent(record?.agentId);
  const [loading, setLoading] = useState(!record?.transcript.length);

  useEffect(() => {
    if (!id || record?.transcript.length) return;
    loadCall(id)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, record?.transcript.length, loadCall]);

  const lines = record?.transcript ?? [];

  const share = () => {
    if (!record || !agent) return;
    const text = lines.map((l) => `${l.speaker === 'user' ? 'You' : agent.name}: ${l.text}`).join('\n\n');
    void Share.share({ message: `Call with ${agent.name} · ${formatCallDate(record.startedAt)}\n\n${text}` });
  };

  if (loading && !lines.length) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Transcript" />
        <ActivityIndicator color={colors.ink} style={styles.spinner} />
      </View>
    );
  }

  if (!record || !agent || !lines.length) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Transcript" />
        <EmptyState icon={MessageSquareText} title="No transcript" message="Nothing was said on this call." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Transcript"
        bordered
        right={<HeaderIconButton icon={ShareIcon} accessibilityLabel="Share transcript" onPress={share} />}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xxxl }]}>
        <View style={styles.meta}>
          <AgentAvatar agent={agent} size={44} />
          <View style={styles.flex}>
            <AppText variant="headline">{agent.name}</AppText>
            <AppText variant="footnote" tone="secondary">
              {formatCallDate(record.startedAt)}
              {record.durationSeconds > 0 ? `  ·  ${formatDuration(record.durationSeconds)}` : ''}
            </AppText>
          </View>
        </View>

        {lines.map((line, i) => {
          const mine = line.speaker === 'user';
          // Only label the first of several lines in a row from the same speaker.
          const newSpeaker = i === 0 || lines[i - 1].speaker !== line.speaker;
          return (
            <View key={i} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs, newSpeaker && styles.rowGap]}>
              {newSpeaker && (
                <AppText variant="caption" weight="600" tone="secondary" style={mine && styles.whoMine}>
                  {mine ? 'You' : agent.name}
                </AppText>
              )}
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : [styles.bubbleTheirs, { backgroundColor: agent.tone.background }],
                ]}
              >
                <AppText variant="body" style={mine ? styles.textMine : { color: colors.text.primary }}>
                  {line.text}
                </AppText>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  flex: { flex: 1 },
  row: { gap: 4, marginTop: 6, maxWidth: '84%' },
  rowGap: { marginTop: spacing.lg },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  whoMine: { textAlign: 'right' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg + 2 },
  bubbleMine: { backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  bubbleTheirs: { borderBottomLeftRadius: 6 },
  textMine: { color: colors.text.inverse },
  spinner: { marginTop: spacing.huge },
});
