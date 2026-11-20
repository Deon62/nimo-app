import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/AgentAvatar';
import { AgentStories } from '@/components/AgentStories';
import { AppText } from '@/components/AppText';
import { IdeaTiles } from '@/components/IdeaTiles';
import { PressableScale } from '@/components/PressableScale';
import { SampleCallCard } from '@/components/SampleCallCard';
import { agents, featuredAgentId, getAgent } from '@/data/agents';
import { ideas } from '@/data/ideas';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';
import { greetingFor } from '@/utils/format';

export function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  const { profile } = useAccount();
  const sampleAgent = getAgent(featuredAgentId) ?? agents[0];

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
        <AppText variant="section" accessibilityRole="header" style={styles.sectionTitle}>
          Things to try
        </AppText>
        <IdeaTiles ideas={ideas} />
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
  sectionTitle: { marginBottom: spacing.md },
});
