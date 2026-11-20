import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { router } from 'expo-router';

import { useVoiceCall, type CompletedCall, type VoiceCallController } from '@/hooks/useVoiceCall';
import { useCallHistory } from './CallHistoryContext';
import { useVoicePreview } from './VoicePreviewContext';

interface ActiveCallValue extends VoiceCallController {
  /** Starts a call with an agent and presents the call screen. */
  callAgent: (agentId: string, options?: { video?: boolean }) => void;
}

const ActiveCallContext = createContext<ActiveCallValue | null>(null);

export function ActiveCallProvider({ children }: { children: ReactNode }) {
  const { addCall, refresh } = useCallHistory();

  const onCallEnded = useCallback(
    (completed: CompletedCall) => {
      if (!completed.connected) return;
      addCall({
        id: completed.id,
        agentId: completed.agentId,
        startedAt: new Date(completed.startedAt).toISOString(),
        durationSeconds: completed.durationSeconds,
        status: completed.connected ? 'completed' : 'cancelled',
        recorded: completed.recorded,
        transcript: completed.transcript,
      });
      // Pick up the saved version once the API has it.
      setTimeout(() => void refresh(), 1500);
    },
    [addCall, refresh],
  );

  const controller = useVoiceCall({ onCallEnded });
  const { stop: stopPreview } = useVoicePreview();
  const { call, start, end, dismiss, setVideo } = controller;

  // Clears an ended call even if it was ended from the minimised call bar.
  const phase = call?.phase;
  useEffect(() => {
    if (phase !== 'ended') return;
    // Leave errors up long enough to read.
    const t = setTimeout(dismiss, call?.error ? 4000 : 1800);
    return () => clearTimeout(t);
  }, [phase, dismiss, call?.error]);

  const callAgent = useCallback(
    (agentId: string, options: { video?: boolean } = {}) => {
      stopPreview();
      const ongoing = call && call.phase !== 'ended';
      if (ongoing && call.agentId === agentId) {
        if (options.video) setVideo(true);
        router.push('/call');
        return;
      }
      if (ongoing) end();
      void start(agentId, options);
      router.push('/call');
    },
    [call, start, end, setVideo, stopPreview],
  );

  const value = useMemo(() => ({ ...controller, callAgent }), [controller, callAgent]);

  return <ActiveCallContext.Provider value={value}>{children}</ActiveCallContext.Provider>;
}

export function useActiveCall(): ActiveCallValue {
  const ctx = useContext(ActiveCallContext);
  if (!ctx) throw new Error('useActiveCall must be used inside ActiveCallProvider');
  return ctx;
}
