import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CircleDot, SearchX } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HeaderSearch } from '@/components/HeaderSearch';
import { Separator } from '@/components/Separator';
import { SkeletonRows } from '@/components/Skeleton';
import { getAgent } from '@/data/agents';
import { callStatusLabel, type CallRecord } from '@/data/calls';
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useCallHistory } from '@/state/CallHistoryContext';
import { colors, screenPadding, spacing } from '@/theme';
import { callDayHeading, formatDuration } from '@/utils/format';

const AVATAR = 46;
const phoneImage = require('../../assets/phone.png');

function CallRow({ record }: { record: CallRecord }) {
  const agent = getAgent(record.agentId);
  if (!agent) return null;
  const failed = record.status !== 'completed';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/call-history/[id]', params: { id: record.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${agent.name}, ${failed ? callStatusLabel[record.status] : formatDuration(record.durationSeconds)}`}
    >
      {({ pressed }) => (
        <View style={[styles.row, pressed && styles.pressed]}>
          <AgentAvatar agent={agent} size={AVATAR} />
          <AppText variant="headline" tone={failed ? 'danger' : 'primary'} numberOfLines={1} style={styles.name}>
            {agent.name}
          </AppText>
          {record.recorded && <CircleDot size={14} color={colors.text.tertiary} strokeWidth={2} />}
          <AppText variant="subhead" tone="secondary" style={styles.duration}>
            {failed ? '—' : formatDuration(record.durationSeconds)}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

export function CallHistoryScreen() {
  const { top } = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  const { calls, restoreSampleHistory } = useCallHistory();
  const loading = useSimulatedLoading();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const matches = q
      ? sorted.filter((call) => {
          const agent = getAgent(call.agentId);
          return [agent?.name, agent?.role, callDayHeading(call.startedAt)].some((f) => f?.toLowerCase().includes(q));
        })
      : sorted;
    const sections: { title: string; data: CallRecord[] }[] = [];
    for (const call of matches) {
      const title = callDayHeading(call.startedAt);
      const last = sections[sections.length - 1];
      if (last?.title === title) last.data.push(call);
      else sections.push({ title, data: [call] });
    }
    return sections;
  }, [calls, query]);

  const hasCalls = calls.length > 0;

  const header = (
    <View style={styles.header}>
      {hasCalls ? (
        <HeaderSearch
          title="Your calls"
          open={searching}
          onOpenChange={setSearching}
          value={query}
          onChangeText={setQuery}
          placeholder="Search calls"
        />
      ) : (
        <AppText variant="largeTitle" accessibilityRole="header">
          Your calls
        </AppText>
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: top + spacing.md }]}>
      <SectionList
        sections={loading ? [] : filtered}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText variant="footnote" weight="600" tone="secondary" style={styles.sectionHeader}>
            {section.title}
          </AppText>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <CallRow record={item} />}
        ItemSeparatorComponent={() => <Separator inset={screenPadding + AVATAR + spacing.md + 2} />}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.gutter}>
              <SkeletonRows count={4} avatarSize={AVATAR} />
            </View>
          ) : hasCalls ? (
            <EmptyState icon={SearchX} title="No matching calls" message={`Nothing matches “${query.trim()}”.`} />
          ) : (
            <EmptyState
              image={phoneImage}
              title="No calls yet"
              message="Your conversations will appear here."
              actionLabel="Explore agents"
              onAction={() => router.navigate('/explore')}
            />
          )
        }
        ListFooterComponent={
          !loading && !hasCalls ? (
            <Pressable onPress={restoreSampleHistory} style={styles.restore} accessibilityRole="button">
              <AppText variant="footnote" tone="secondary" align="center">
                Restore sample calls
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { paddingHorizontal: screenPadding, marginBottom: spacing.sm },
  gutter: { paddingHorizontal: screenPadding },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    paddingVertical: spacing.md,
    paddingHorizontal: screenPadding,
  },
  pressed: { backgroundColor: colors.background.secondary },
  name: { flex: 1 },
  sectionHeader: { paddingHorizontal: screenPadding, paddingTop: spacing.xl, paddingBottom: spacing.xs },
  duration: { fontVariant: ['tabular-nums'] },
  restore: { paddingVertical: spacing.md, minHeight: 44, justifyContent: 'center' },
});
