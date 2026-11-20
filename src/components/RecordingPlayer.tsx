import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import type { Agent } from '@/data/agents';
import { api } from '@/lib/api';
import { useVoicePreview } from '@/state/VoicePreviewContext';
import { colors } from '@/theme';
import { withAlpha } from '@/utils/color';
import { formatDuration } from '@/utils/format';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const BARS = 36;

// Deterministic, natural-looking waveform heights for a given call.
function heights(seed: string): number[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: BARS }, (_, i) => {
    const x = Math.sin(h * 0.001 + i * 1.7) * 43758.5453;
    const r = x - Math.floor(x);
    const envelope = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / BARS);
    return 0.2 + 0.8 * r * envelope;
  });
}

interface RecordingPlayerProps {
  callId: string;
  agent: Agent;
  durationSeconds: number;
}

/** Plays back a recorded call: both sides of each turn, in order, from secure short-lived links. */
export function RecordingPlayer({ callId, agent, durationSeconds }: RecordingPlayerProps) {
  const { playingId, lineIndex, toggleScript } = useVoicePreview();
  const [segments, setSegments] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const id = `recording-${callId}`;
  const playing = playingId === id;
  const progress = playing && segments?.length ? (lineIndex + 1) / segments.length : 0;
  const bars = heights(callId);

  const onPress = async () => {
    if (playing || segments) {
      toggleScript(id, segments ?? []);
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ segments: string[] }>(`/calls/${callId}/recording`);
      setSegments(res.segments);
      setEmpty(res.segments.length === 0);
      toggleScript(id, res.segments);
    } catch {
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.player}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={playing ? 'Pause recording' : 'Play recording'}
        activeScale={0.92}
        style={[styles.play, { backgroundColor: agent.tone.foreground }]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : playing ? (
          <Pause size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
        ) : (
          <Play size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} style={styles.playIcon} />
        )}
      </PressableScale>
      <View style={styles.wave} accessibilityElementsHidden>
        {bars.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 6 + h * 26,
                backgroundColor: i / BARS < progress ? agent.tone.foreground : withAlpha(agent.tone.foreground, 0.28),
              },
            ]}
          />
        ))}
      </View>
      <AppText variant="footnote" tone="secondary" style={styles.time}>
        {empty ? 'No audio' : formatDuration(durationSeconds)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  player: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  play: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  playIcon: { marginLeft: 2 },
  wave: { flex: 1, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { width: 3, borderRadius: 1.5 },
  time: { fontVariant: ['tabular-nums'], color: colors.text.secondary },
});
