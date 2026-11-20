import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AudioLines, Phone, Square, UserX, Video, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { AvailabilityLabel } from '@/components/AvailabilityLabel';
import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getAgent } from '@/data/agents';
import { useActiveCall } from '@/state/ActiveCallContext';
import { useVoicePreview } from '@/state/VoicePreviewContext';
import { colors, screenPadding, spacing } from '@/theme';

const ACTION_SIZE = 60;

/** Round action with a caption underneath; all three on the page share one size. */
function ActionCircle({
  icon: Icon,
  label,
  onPress,
  filled = false,
  disabled = false,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  filled?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <View style={[styles.action, disabled && styles.disabled]}>
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        activeScale={0.92}
        style={[styles.circle, filled ? styles.circleFilled : styles.circleOutline]}
      >
        <Icon size={24} color={filled ? '#FFFFFF' : colors.ink} strokeWidth={1.9} />
      </PressableScale>
      <AppText variant="footnote" weight="500">
        {label}
      </AppText>
    </View>
  );
}

// iOS presents this as a sheet that already sits below the status bar.
const SHEET_PRESENTATION = Platform.OS === 'ios';

export function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const { callAgent } = useActiveCall();
  const preview = useVoicePreview();
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
  const playing = preview.playingId === agent.id;

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
          <ActionCircle
            icon={Phone}
            label={offline ? 'Offline' : 'Call'}
            filled
            disabled={offline}
            onPress={() => callAgent(agent.id)}
            accessibilityLabel={offline ? `${agent.name} is offline` : `Call ${agent.name}`}
          />
          <ActionCircle
            icon={playing ? Square : AudioLines}
            label={playing ? 'Stop' : 'Listen'}
            onPress={() => preview.toggle(agent)}
            accessibilityLabel={playing ? `Stop ${agent.name}'s voice` : `Listen to ${agent.name}'s voice`}
          />
          <ActionCircle
            icon={Video}
            label="Video"
            disabled={offline}
            onPress={() => callAgent(agent.id, { video: true })}
            accessibilityLabel={`Video call ${agent.name}`}
          />
        </View>

        <AppText variant="subhead" tone="secondary" align="center" style={styles.tagline}>
          {agent.tagline}
        </AppText>

        <View style={styles.section}>
          <AppText variant="footnote" tone="tertiary" style={styles.kicker}>
            CAN HELP WITH
          </AppText>
          <AppText variant="callout" style={styles.helpText}>
            {agent.helpsWith}
          </AppText>
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
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xxxl },
  action: { alignItems: 'center', gap: spacing.sm, width: ACTION_SIZE + 16 },
  circle: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFilled: { backgroundColor: colors.ink },
  circleOutline: { borderWidth: 1.5, borderColor: colors.border },
  helpText: { lineHeight: 22 },
  disabled: { opacity: 0.4 },
  tagline: { paddingHorizontal: spacing.sm },
  section: { gap: 6 },
  kicker: { letterSpacing: 0.8, marginBottom: 2 },
});
