import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Phone, X } from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { VoicePreviewButton } from '@/components/VoicePreviewButton';
import { agents, availabilityLabel, getAgent, type Agent } from '@/data/agents';
import { useActiveCall } from '@/state/ActiveCallContext';
import { useStories } from '@/state/StoriesContext';
import { useVoicePreview } from '@/state/VoicePreviewContext';
import { colors, hitTarget, screenPadding, spacing } from '@/theme';

const SLIDES = 3;
const SLIDE_MS = 5000;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function Segment({ state, progress }: { state: 'done' | 'active' | 'todo'; progress: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({
    width: `${(state === 'done' ? 1 : state === 'active' ? progress.get() : 0) * 100}%`,
  }));
  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fill]} />
    </View>
  );
}

function Slide({ agent, index }: { agent: Agent; index: number }) {
  if (index === 0) {
    return (
      <View style={styles.slideCentre}>
        <AgentAvatar agent={agent} size={168} />
        <AppText variant="largeTitle" tone="inverse" align="center" style={styles.storyName}>
          {agent.name}
        </AppText>
        <AppText variant="body" align="center" style={styles.muted}>
          {agent.role}
        </AppText>
        <View style={styles.availability}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: agent.availability === 'available' ? colors.accent.success : colors.dark.textTertiary,
              },
            ]}
          />
          <AppText variant="footnote" style={styles.muted}>
            {availabilityLabel[agent.availability]}
          </AppText>
        </View>
      </View>
    );
  }
  if (index === 1) {
    return (
      <View style={styles.slideLeft}>
        <AppText variant="label" style={styles.kicker}>
          GOOD AT
        </AppText>
        {agent.capabilities.map((title) => (
          <AppText key={title} variant="title" tone="inverse" style={styles.capability}>
            {title}
          </AppText>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.slideCentre}>
      <AppText variant="label" style={styles.kicker}>
        VOICE
      </AppText>
      <AppText variant="largeTitle" tone="inverse" align="center" style={styles.voiceName}>
        {agent.voice.name}
      </AppText>
      <AppText variant="body" align="center" style={styles.muted}>
        {agent.voice.description}
      </AppText>
      <VoicePreviewButton agent={agent} appearance="dark" size="large" label="Hear voice" style={styles.listen} />
    </View>
  );
}

export function AgentStoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top, bottom } = useSafeAreaInsets();
  const { markSeen } = useStories();
  const { callAgent } = useActiveCall();
  const { playingId, stop } = useVoicePreview();
  const agent = getAgent(id) ?? agents[0];
  const [slide, setSlide] = useState(0);
  const progress = useSharedValue(0);
  const paused = playingId === agent.id;

  useEffect(() => markSeen(agent.id), [agent.id, markSeen]);
  useEffect(() => stop, [stop]);

  const next = useCallback(() => {
    if (slide < SLIDES - 1) {
      setSlide((s) => s + 1);
      return;
    }
    const idx = agents.findIndex((a) => a.id === agent.id);
    const following = agents[idx + 1];
    if (following) {
      stop();
      setSlide(0);
      router.setParams({ id: following.id });
    } else {
      close();
    }
  }, [slide, agent.id, stop]);

  const prev = useCallback(() => {
    if (slide > 0) {
      setSlide((s) => s - 1);
      return;
    }
    const idx = agents.findIndex((a) => a.id === agent.id);
    const previous = agents[idx - 1];
    if (previous) {
      stop();
      router.setParams({ id: previous.id });
    }
    progress.set(0);
  }, [slide, agent.id, stop, progress]);

  // Auto-advance; holds while the voice preview is playing.
  useEffect(() => {
    cancelAnimation(progress);
    if (paused) return;
    progress.set(0);
    progress.set(withTiming(1, { duration: SLIDE_MS, easing: Easing.linear }));
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [agent.id, slide, paused, next, progress]);

  const offline = agent.availability === 'offline';

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: top + spacing.sm, paddingBottom: Math.max(bottom, spacing.lg) + spacing.sm },
      ]}
    >
      <StatusBar style="light" />

      <View style={styles.segments}>
        {Array.from({ length: SLIDES }, (_, i) => (
          <Segment
            key={`${agent.id}-${i}`}
            state={i < slide ? 'done' : i === slide ? 'active' : 'todo'}
            progress={progress}
          />
        ))}
      </View>

      <View style={styles.header}>
        <AgentAvatar agent={agent} size={32} />
        <AppText variant="subhead" weight="600" tone="inverse" style={styles.headerName}>
          {agent.name}
        </AppText>
        <PressableScale onPress={close} accessibilityLabel="Close" style={styles.close} activeScale={0.9}>
          <X size={24} color="#FFFFFF" strokeWidth={1.8} />
        </PressableScale>
      </View>

      <View style={styles.body}>
        <Animated.View key={`${agent.id}-${slide}`} entering={FadeIn.duration(280)} style={styles.slide}>
          <Slide agent={agent} index={slide} />
        </Animated.View>
        {/* Tap zones: left goes back, right goes forward. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.tapRow} pointerEvents="box-none">
            <Pressable style={styles.tapLeft} onPress={prev} accessibilityLabel="Previous" />
            <View style={styles.tapGap} pointerEvents="none" />
            <Pressable style={styles.tapRight} onPress={next} accessibilityLabel="Next" />
          </View>
        </View>
      </View>

      <Button
        label={offline ? `${agent.name} is offline` : `Call ${agent.name}`}
        variant="light"
        size="large"
        disabled={offline}
        icon={offline ? undefined : <Phone size={18} color={colors.ink} strokeWidth={2} />}
        onPress={() => {
          stop();
          router.back();
          callAgent(agent.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark.surface, paddingHorizontal: screenPadding },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.22)', overflow: 'hidden' },
  segmentFill: { height: '100%', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  headerName: { flex: 1 },
  close: { width: hitTarget, height: hitTarget, alignItems: 'flex-end', justifyContent: 'center' },
  body: { flex: 1 },
  slide: { flex: 1 },
  slideCentre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.huge },
  slideLeft: { flex: 1, justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.huge },
  storyName: { marginTop: spacing.xxl, fontSize: 40, lineHeight: 46 },
  muted: { color: colors.dark.textSecondary, marginTop: 4 },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  kicker: { color: colors.dark.textTertiary, marginBottom: spacing.sm },
  capability: { fontWeight: '500' },
  voiceName: { fontSize: 40, lineHeight: 46 },
  listen: { marginTop: spacing.xxxl, zIndex: 2 },
  tapRow: { flex: 1, flexDirection: 'row' },
  tapLeft: { width: '24%' },
  tapGap: { flex: 1 },
  tapRight: { width: '24%' },
});
