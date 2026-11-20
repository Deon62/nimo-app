import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Phone, UserX, Video } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { AvailabilityLabel } from '@/components/AvailabilityLabel';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { VoicePreviewButton } from '@/components/VoicePreviewButton';
import { getAgent } from '@/data/agents';
import { useActiveCall } from '@/state/ActiveCallContext';
import { colors, screenPadding, spacing } from '@/theme';

// iOS presents this as a sheet that already sits below the status bar.
const SHEET_PRESENTATION = Platform.OS === 'ios';

export function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const { callAgent } = useActiveCall();
  const agent = getAgent(id);
  // Fits on one screen; only scrolls on very small devices where it would otherwise clip.
  const [viewport, setViewport] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  if (!agent) {
    return (
      <View style={styles.screen}>
        <ScreenHeader mode="close" respectTopInset={!SHEET_PRESENTATION} />
        <EmptyState icon={UserX} title="Agent not found" message="This agent is no longer available." />
      </View>
    );
  }

  const offline = agent.availability === 'offline';

  return (
    <View style={styles.screen}>
      <ScreenHeader mode="close" respectTopInset={!SHEET_PRESENTATION} />
      <ScrollView
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        scrollEnabled={contentHeight > viewport + 1}
        bounces={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom, spacing.lg) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AgentAvatar agent={agent} size={92} showStatus />
          <AppText variant="title" align="center" style={styles.name}>
            {agent.name}
          </AppText>
          <AppText variant="subhead" tone="secondary" align="center">
            {agent.role}
          </AppText>
          <View style={styles.availability}>
            <AvailabilityLabel availability={agent.availability} />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={offline ? 'Offline' : 'Call'}
            size="large"
            icon={offline ? undefined : <Phone size={18} color="#FFFFFF" strokeWidth={2} />}
            disabled={offline}
            onPress={() => callAgent(agent.id)}
            style={styles.flex}
          />
          <VoicePreviewButton agent={agent} size="large" style={styles.flex} />
          <PressableScale
            onPress={() => callAgent(agent.id, { video: true })}
            disabled={offline}
            accessibilityLabel={`Video call ${agent.name}`}
            activeScale={0.92}
            style={[styles.videoButton, offline && styles.disabled]}
          >
            <Video size={22} color={colors.ink} strokeWidth={1.8} />
          </PressableScale>
        </View>

        <AppText variant="subhead" tone="secondary" align="center" style={styles.tagline}>
          {agent.tagline}
        </AppText>

        <View style={styles.section}>
          <AppText variant="footnote" tone="tertiary" style={styles.kicker}>
            TRY ASKING
          </AppText>
          {agent.starters.map((item) => (
            <AppText key={item} variant="callout" style={styles.capability}>
              “{item}”
            </AppText>
          ))}
        </View>

        <View style={styles.section}>
          <AppText variant="footnote" tone="tertiary" style={styles.kicker}>
            VOICE
          </AppText>
          <AppText variant="callout" weight="600">
            {agent.voice.name}
          </AppText>
          <AppText variant="subhead" tone="secondary">
            {agent.voice.description}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding + 4,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center' },
  name: { marginTop: spacing.md },
  availability: { marginTop: 6 },
  actions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  videoButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  flex: { flex: 1 },
  tagline: { paddingHorizontal: spacing.sm },
  section: { gap: 6 },
  kicker: { letterSpacing: 0.8, marginBottom: 2 },
  capability: { color: colors.text.primary },
});
