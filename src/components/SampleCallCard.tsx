import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pause, Phone, Play } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Agent } from '@/data/agents';
import { useActiveCall } from '@/state/ActiveCallContext';
import { sampleLineUrl, useVoicePreview } from '@/state/VoicePreviewContext';
import { colors, radius, spacing } from '@/theme';
import { mix, withAlpha } from '@/utils/color';
import { formatDuration } from '@/utils/format';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { VoiceOrb } from './VoiceOrb';

/** Rough speaking speed, used only to show the sample length. */
const MS_PER_CHAR = 62;
const BARS = 30;

interface SampleCallCardProps {
  agent: Agent;
  title: string;
}

/**
 * A pre-recorded example call new users can listen to before making their own.
 * Plays both voices; the waveform fills as it goes and the current line fades in below.
 */
export function SampleCallCard({ agent, title }: SampleCallCardProps) {
  const { playingId, lineIndex, toggleScript } = useVoicePreview();
  const { callAgent } = useActiveCall();
  const id = `sample-${agent.id}`;
  const playing = playingId === id;

  const transcript = useMemo(
    () =>
      agent.script.flatMap((turn) => [
        { speaker: 'user' as const, text: turn.user },
        { speaker: 'agent' as const, text: turn.agent },
      ]),
    [agent],
  );
  const lines = transcript.map((_, i) => sampleLineUrl(agent.id, i));
  const seconds = Math.round((transcript.reduce((n, l) => n + l.text.length, 0) * MS_PER_CHAR) / 1000);

  // Waveform: one bar group per line, louder for the agent.
  const bars = useMemo(
    () =>
      Array.from({ length: BARS }, (_, i) => {
        const line = Math.min(transcript.length - 1, Math.floor((i / BARS) * transcript.length));
        const loud = transcript[line].speaker === 'agent' ? 1 : 0.65;
        return { line, h: (0.35 + 0.65 * Math.abs(Math.sin(i * 1.9) * Math.cos(i * 0.7))) * loud };
      }),
    [transcript],
  );

  const current = transcript[lineIndex];
  const orbPhase = !playing ? 'listening' : current.speaker === 'agent' ? 'speaking' : 'listening';
  const base = mix(colors.ink, agent.tone.foreground, 0.32);

  return (
    <View style={[styles.card, { backgroundColor: base }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: withAlpha(agent.tone.foreground, 0.45) }]} />

      <View style={styles.header}>
        <VoiceOrb phase={orbPhase} tone={agent.tone} size={56} halo={false} />
        <View style={styles.headerText}>
          <AppText variant="headline" tone="inverse" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="footnote" style={styles.muted}>
            {agent.name} · {formatDuration(seconds)}
          </AppText>
        </View>
        <PressableScale
          onPress={() => callAgent(agent.id)}
          disabled={agent.availability === 'offline'}
          accessibilityLabel={`Call ${agent.name}`}
          activeScale={0.9}
          style={styles.callButton}
        >
          <Phone size={18} color="#FFFFFF" strokeWidth={1.9} />
        </PressableScale>
      </View>

      <View style={styles.player}>
        <PressableScale
          onPress={() => toggleScript(id, lines)}
          accessibilityLabel={playing ? 'Pause sample call' : 'Play sample call'}
          activeScale={0.9}
          style={styles.play}
        >
          {playing ? (
            <Pause size={18} color={colors.ink} fill={colors.ink} strokeWidth={1.5} />
          ) : (
            <Play size={18} color={colors.ink} fill={colors.ink} strokeWidth={1.5} style={styles.playIcon} />
          )}
        </PressableScale>
        <View style={styles.wave} accessibilityElementsHidden>
          {bars.map((b, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: 6 + b.h * 26,
                  backgroundColor: playing && b.line <= lineIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {playing && (
        <Animated.View
          key={lineIndex}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(120)}
          accessibilityLiveRegion="polite"
        >
          <AppText variant="subhead" numberOfLines={2} style={styles.line}>
            <AppText variant="subhead" weight="600" style={styles.who}>
              {current.speaker === 'user' ? 'You  ' : `${agent.name}  `}
            </AppText>
            {current.text}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radius.xl + 6, padding: spacing.xl, gap: spacing.xl },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -170, left: -70 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  muted: { color: 'rgba(255, 255, 255, 0.6)' },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { marginLeft: 2 },
  wave: { flex: 1, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { width: 3, borderRadius: 1.5 },
  line: { color: '#FFFFFF', lineHeight: 21 },
  who: { color: 'rgba(255, 255, 255, 0.55)' },
});
