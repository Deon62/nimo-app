import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { History, Lock, MessageSquareText, Phone, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { InsetGroup } from '@/components/InsetGroup';
import { ListRow } from '@/components/ListRow';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getAgent } from '@/data/agents';
import { callStatusLabel } from '@/data/calls';
import { useActiveCall } from '@/state/ActiveCallContext';
import { useCallHistory } from '@/state/CallHistoryContext';
import { colors, screenPadding, spacing } from '@/theme';
import { formatCallDate, formatDuration } from '@/utils/format';

export function CallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const { getCall, removeCall, loadCall } = useCallHistory();
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { callAgent } = useActiveCall();
  const record = getCall(id);
  const agent = getAgent(record?.agentId);

  useEffect(() => {
    if (!id) return;
    loadCall(id)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, loadCall]);

  if (!record && loading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader />
        <ActivityIndicator color={colors.ink} style={styles.spinner} />
      </View>
    );
  }

  if (!record || !agent) {
    return (
      <View style={styles.screen}>
        <ScreenHeader />
        <EmptyState icon={History} title="Call not found" message="It may have been removed." />
      </View>
    );
  }

  const completed = record.status === 'completed';

  return (
    <View style={styles.screen}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xxxl }]}>
        <View style={styles.hero}>
          <AgentAvatar agent={agent} size={88} />
          <AppText variant="title" align="center" style={styles.name}>
            {agent.name}
          </AppText>
          <AppText variant="subhead" tone="secondary" align="center">
            {agent.role}
          </AppText>
          <View style={styles.actions}>
            <Button
              label="Call again"
              icon={<Phone size={17} color="#FFFFFF" strokeWidth={2} />}
              onPress={() => callAgent(agent.id)}
              disabled={agent.availability === 'offline'}
              style={styles.flex}
            />
            <Button
              label="View agent"
              variant="secondary"
              onPress={() => router.push({ pathname: '/agent/[id]', params: { id: agent.id } })}
              style={styles.flex}
            />
          </View>
        </View>

        {completed && (
          <View style={styles.recording}>
            <AppText variant="footnote" style={styles.kicker}>
              RECORDING
            </AppText>
            {record.recorded ? (
              <RecordingPlayer callId={record.id} agent={agent} durationSeconds={record.durationSeconds} />
            ) : (
              <ListRow
                type="link"
                icon={Lock}
                label="Not recorded"
                detail="Record calls on Plus or Pro"
                onPress={() => router.push('/plans')}
              />
            )}
          </View>
        )}

        {record.transcript.length > 0 && (
          <View style={styles.recording}>
            <AppText variant="footnote" style={styles.kicker}>
              TRANSCRIPT
            </AppText>
            <ListRow
              type="link"
              icon={MessageSquareText}
              label="View transcript"
              detail={`${record.transcript.length} ${record.transcript.length === 1 ? 'message' : 'messages'}`}
              onPress={() => router.push({ pathname: '/call-history/transcript/[id]', params: { id: record.id } })}
            />
          </View>
        )}

        <InsetGroup>
          <ListRow type="value" label="Date" value={formatCallDate(record.startedAt)} />
          <ListRow type="value" label="Duration" value={completed ? formatDuration(record.durationSeconds) : '—'} />
          <ListRow type="value" label="Status" value={callStatusLabel[record.status]} />
        </InsetGroup>

        <InsetGroup>
          <ListRow type="link" icon={Trash2} label="Delete call" destructive onPress={() => setConfirmDelete(true)} />
        </InsetGroup>
      </ScrollView>
      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this call?"
        message={record.recorded ? 'The recording will be deleted too.' : undefined}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (router.canGoBack()) router.back();
          else router.replace('/calls');
          removeCall(record.id).catch(() => {});
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingHorizontal: screenPadding, gap: spacing.xxxl, width: '100%', maxWidth: 680, alignSelf: 'center' },
  hero: { alignItems: 'center', paddingTop: spacing.md },
  name: { marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, alignSelf: 'stretch' },
  flex: { flex: 1 },
  recording: { gap: spacing.md },
  kicker: { letterSpacing: 0.6, color: colors.text.tertiary },
  spinner: { marginTop: spacing.huge },
});
