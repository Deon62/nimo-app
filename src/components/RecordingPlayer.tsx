import { StyleSheet, View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';

import type { Agent } from '@/data/agents';
import type { TranscriptLine } from '@/data/calls';
import { lineForAgent, useVoicePreview, type SpokenLine } from '@/state/VoicePreviewContext';
import { colors } from '@/theme';
import { withAlpha } from '@/utils/color';
import { formatDuration } from '@/utils/format';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const BARS = 36;
const CALLER_VOICE = { pitch: 1.05, rate: 1.02, language: 'en-US' };

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
  transcript: TranscriptLine[];
  durationSeconds: number;
}

/** Plays back a recorded call. Audio is approximated with on-device voices until real recordings exist. */
export function RecordingPlayer({ callId, agent, transcript, durationSeconds }: RecordingPlayerProps) {
  const { playingId, lineIndex, toggleScript } = useVoicePreview();
  const id = `recording-${callId}`;
  const playing = playingId === id;
  const lines: SpokenLine[] = transcript.map((l) =>
    l.speaker === 'agent' ? lineForAgent(agent, l.text) : { text: l.text, ...CALLER_VOICE },
  );
  const progress = playing && lines.length ? (lineIndex + 1) / lines.length : 0;
  const bars = heights(callId);

  return (
    <View style={styles.player}>
      <PressableScale
        onPress={() => toggleScript(id, lines)}
        accessibilityLabel={playing ? 'Pause recording' : 'Play recording'}
        activeScale={0.92}
        style={[styles.play, { backgroundColor: agent.tone.foreground }]}
      >
        {playing ? (
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
        {formatDuration(durationSeconds)}
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
