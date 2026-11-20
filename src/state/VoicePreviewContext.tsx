import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Speech from 'expo-speech';

import type { Agent } from '@/data/agents';

export interface SpokenLine {
  text: string;
  pitch: number;
  rate: number;
  language: string;
}

interface VoicePreviewValue {
  /** Id of whatever is playing: an agent id for voice previews, or a sample-call id. */
  playingId: string | null;
  /** Index of the line currently being spoken within the playing script. */
  lineIndex: number;
  toggle: (agent: Agent) => void;
  toggleScript: (id: string, lines: SpokenLine[]) => void;
  stop: () => void;
}

const VoicePreviewContext = createContext<VoicePreviewValue | null>(null);

export function lineForAgent(agent: Agent, text: string = agent.voice.sample): SpokenLine {
  return { text, pitch: agent.voice.pitch, rate: agent.voice.rate, language: agent.voice.language };
}

/**
 * Plays voice previews and pre-recorded sample calls, one at a time.
 * Uses on-device text-to-speech for now; swap `speakLine` for recorded audio from the
 * backend (e.g. OpenAI voice clips) without touching the UI.
 */
export function VoicePreviewProvider({ children }: { children: ReactNode }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current += 1;
    setPlayingId(null);
    setLineIndex(0);
    void Speech.stop();
  }, []);

  const toggleScript = useCallback(
    (id: string, lines: SpokenLine[]) => {
      if (playingId === id) {
        stop();
        return;
      }
      void Speech.stop();
      const current = ++token.current;
      setPlayingId(id);
      setLineIndex(0);

      const speakLine = (i: number) => {
        if (token.current !== current) return;
        if (i >= lines.length) {
          setPlayingId(null);
          setLineIndex(0);
          return;
        }
        setLineIndex(i);
        const line = lines[i];
        const next = () => {
          setTimeout(() => speakLine(i + 1), 350);
        };
        Speech.speak(line.text, {
          pitch: line.pitch,
          rate: line.rate,
          language: line.language,
          onDone: next,
          onError: () => {
            if (token.current === current) setPlayingId(null);
          },
        });
      };
      speakLine(0);
    },
    [playingId, stop],
  );

  const toggle = useCallback((agent: Agent) => toggleScript(agent.id, [lineForAgent(agent)]), [toggleScript]);

  useEffect(() => () => void Speech.stop(), []);

  const value = useMemo(
    () => ({ playingId, lineIndex, toggle, toggleScript, stop }),
    [playingId, lineIndex, toggle, toggleScript, stop],
  );
  return <VoicePreviewContext.Provider value={value}>{children}</VoicePreviewContext.Provider>;
}

export function useVoicePreview(): VoicePreviewValue {
  const ctx = useContext(VoicePreviewContext);
  if (!ctx) throw new Error('useVoicePreview must be used inside VoicePreviewProvider');
  return ctx;
}
