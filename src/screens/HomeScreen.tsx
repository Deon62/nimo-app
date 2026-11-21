import { Fragment, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/AgentAvatar';
import { AgentCard } from '@/components/AgentCard';
import { AgentStories } from '@/components/AgentStories';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { SampleCallCard } from '@/components/SampleCallCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Separator } from '@/components/Separator';
import { agents, featuredAgentId, getAgent, type Agent } from '@/data/agents';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useAccount } from '@/state/AccountContext';
import { useActiveCall } from '@/state/ActiveCallContext';
import { colors, screenPadding, spacing } from '@/theme';
import { greetingFor } from '@/utils/format';

const CONTACTS_TO_TRY = 4;

/** A few contacts to suggest, changing each day; available ones first, never the featured one. */
function contactsToTry(): Agent[] {
  const day = Math.floor(Date.now() / 86_400_000);
  const pool = agents.filter((a) => a.id !== featuredAgentId && a.availability !== 'offline');
  const start = day % Math.max(pool.length, 1);
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, CONTACTS_TO_TRY);
}

export function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  const { profile } = useAccount();
  const { callAgent } = useActiveCall();
  const sampleAgent = getAgent(featuredAgentId) ?? agents[0];
  const suggested = useMemo(() => contactsToTry(), []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: top + spacing.md, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.gutter}>
        <View style={styles.topRow}>
          <View>
            <AppText variant="footnote" tone="secondary">
              {greetingFor()}
            </AppText>
            <AppText variant="title">{profile.firstName}</AppText>
          </View>
          <PressableScale
            onPress={() => router.navigate('/profile')}
            accessibilityLabel="Open profile"
            activeScale={0.92}
            hitSlop={6}
          >
            <UserAvatar name={profile.firstName} uri={profile.avatarUri} size={40} />
          </PressableScale>
        </View>
      </View>

      <View style={styles.stories}>
        <AgentStories agents={agents} />
      </View>

      <View style={[styles.gutter, styles.section]}>
        <SampleCallCard agent={sampleAgent} title="Plan your week" />
      </View>

      <View style={[styles.gutter, styles.section]}>
        <SectionHeader title="Contacts to try" actionLabel="See all" onAction={() => router.navigate('/explore')} />
        {suggested.map((agent, i) => (
          <Fragment key={agent.id}>
            {i > 0 && <Separator inset={48 + spacing.md + 2} />}
            <AgentCard
              agent={agent}
              onPress={() => router.push({ pathname: '/agent/[id]', params: { id: agent.id } })}
              onCall={() => callAgent(agent.id)}
            />
          </Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  gutter: { paddingHorizontal: screenPadding, width: '100%', maxWidth: 680, alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stories: { marginTop: spacing.xxl, width: '100%', maxWidth: 680, alignSelf: 'center' },
  section: { marginTop: spacing.xxxl },
});
