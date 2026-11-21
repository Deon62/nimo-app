import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setAudioModeAsync, useAudioPlayer, type AudioSource } from 'expo-audio';

import type { Agent } from '@/data/agents';
import { voicePreviewSource } from '@/data/voicePreviews';
import { apiUrl } from '@/lib/api';

interface VoicePreviewValue {
  /** Id of whatever is playing: an agent id for voice previews, or a sample / recording id. */
  playingId: string | null;
  /** Index of the clip currently playing within the playlist. */
  lineIndex: number;
  /** True while the current clip is loading. */
  buffering: boolean;
  toggle: (agent: Agent) => void;
  /** Plays audio clips back to back (sample calls, call recordings). */
  toggleScript: (id: string, urls: (string | AudioSource)[]) => void;
  stop: () => void;
}

const VoicePreviewContext = createContext<VoicePreviewValue | null>(null);

export const sampleLineUrl = (agentId: string, line: number) => apiUrl(`/agents/${agentId}/sample/${line}`);

/** Plays ElevenLabs voice previews, sample calls and recordings, one at a time. */
export function VoicePreviewProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const queue = useRef<{ id: string; urls: (string | AudioSource)[]; index: number } | null>(null);

  const playIndex = useCallback(
    (index: number) => {
      const q = queue.current;
      if (!q) return;
      if (index >= q.urls.length) {
        queue.current = null;
        setPlayingId(null);
        setLineIndex(0);
        return;
      }
      q.index = index;
      setLineIndex(index);
      setBuffering(true);
      const source = q.urls[index];
      player.replace(typeof source === 'string' ? { uri: source } : source);
      player.play();
    },
    [player],
  );

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.playing) setBuffering(false);
      if (status.didJustFinish && queue.current) playIndex(queue.current.index + 1);
    });
    return () => sub.remove();
  }, [player, playIndex]);

  const stop = useCallback(() => {
    queue.current = null;
    setPlayingId(null);
    setLineIndex(0);
    setBuffering(false);
    player.pause();
  }, [player]);

  const toggleScript = useCallback(
    (id: string, urls: (string | AudioSource)[]) => {
      if (playingId === id) {
        stop();
        return;
      }
      if (!urls.length) return;
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      queue.current = { id, urls, index: 0 };
      setPlayingId(id);
      playIndex(0);
    },
    [playingId, stop, playIndex],
  );

  const toggle = useCallback((agent: Agent) => toggleScript(agent.id, [voicePreviewSource(agent.id)]), [toggleScript]);

  const value = useMemo(
    () => ({ playingId, lineIndex, buffering, toggle, toggleScript, stop }),
    [playingId, lineIndex, buffering, toggle, toggleScript, stop],
  );
  return <VoicePreviewContext.Provider value={value}>{children}</VoicePreviewContext.Provider>;
}

export function useVoicePreview(): VoicePreviewValue {
  const ctx = useContext(VoicePreviewContext);
  if (!ctx) throw new Error('useVoicePreview must be used inside VoicePreviewProvider');
  return ctx;
}
