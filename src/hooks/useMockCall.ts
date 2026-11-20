import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { getAgent } from '@/data/agents';
import type { TranscriptLine } from '@/data/calls';

/**
 * DEMO ONLY.
 *
 * A scripted state machine that imitates the rhythm of a voice call
 * (connecting -> listening -> thinking -> speaking -> listening ...).
 * No microphone or network audio is used. When the FastAPI / OpenAI Realtime
 * backend is connected, this hook is the single place to replace: keep the
 * returned shape and drive `phase`, `caption` and `transcript` from real events.
 */

export type CallPhase = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended';

export interface MockCallState {
  id: string;
  agentId: string;
  phase: CallPhase;
  /** Epoch ms when the call connected; null while connecting. */
  connectedAt: number | null;
  elapsedSeconds: number;
  muted: boolean;
  speaker: boolean;
  /** Paid-plan feature; when recording, the call is saved with audio. */
  recording: boolean;
  /** Camera on: the agent can see what you show it. */
  video: boolean;
  facing: 'front' | 'back';
  /** The line currently being "heard" or "spoken". */
  caption: TranscriptLine | null;
  transcript: TranscriptLine[];
  turnIndex: number;
}

export interface CompletedCall {
  id: string;
  agentId: string;
  startedAt: number;
  durationSeconds: number;
  connected: boolean;
  recorded: boolean;
  transcript: TranscriptLine[];
}

const TIMING = {
  connecting: 2200,
  listenBeforeCaption: 1400,
  listenWithCaption: 2400,
  thinking: 1300,
  speakingPerChar: 48,
  speakingMin: 2600,
} as const;

interface Options {
  onCallEnded?: (call: CompletedCall) => void;
}

export function useMockCall({ onCallEnded }: Options = {}) {
  const [call, setCall] = useState<MockCallState | null>(null);
  const startedAtRef = useRef<number>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onEndedRef = useRef(onCallEnded);
  useLayoutEffect(() => {
    onEndedRef.current = onCallEnded;
  }, [onCallEnded]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const patch = useCallback((update: (prev: MockCallState) => Partial<MockCallState>) => {
    setCall((prev) => (prev ? { ...prev, ...update(prev) } : prev));
  }, []);

  // ---- Phase transitions -------------------------------------------------
  const phase = call?.phase;
  const turnIndex = call?.turnIndex ?? 0;
  const muted = call?.muted ?? false;
  const agentId = call?.agentId;
  const callId = call?.id;

  useEffect(() => {
    if (!phase || !agentId) return;
    const script = getAgent(agentId)?.script ?? [];
    const turn = script[turnIndex];
    clearTimers();

    switch (phase) {
      case 'connecting':
        schedule(() => patch(() => ({ phase: 'listening', connectedAt: Date.now() })), TIMING.connecting);
        break;

      case 'listening':
        // Script exhausted: stay quietly in Listening until the call is ended.
        if (!turn) break;
        // While muted the simulated caller "doesn't speak", so the demo pauses.
        if (muted) break;
        schedule(() => patch(() => ({ caption: { speaker: 'user', text: turn.user } })), TIMING.listenBeforeCaption);
        schedule(
          () =>
            patch((prev) => ({
              phase: 'thinking',
              transcript: [...prev.transcript, { speaker: 'user', text: turn.user }],
            })),
          TIMING.listenBeforeCaption + TIMING.listenWithCaption,
        );
        break;

      case 'thinking':
        if (!turn) break;
        schedule(
          () => patch(() => ({ phase: 'speaking', caption: { speaker: 'agent', text: turn.agent } })),
          TIMING.thinking,
        );
        break;

      case 'speaking': {
        if (!turn) break;
        const duration = Math.max(TIMING.speakingMin, turn.agent.length * TIMING.speakingPerChar);
        schedule(
          () =>
            patch((prev) => ({
              phase: 'listening',
              caption: null,
              turnIndex: prev.turnIndex + 1,
              transcript: [...prev.transcript, { speaker: 'agent', text: turn.agent }],
            })),
          duration,
        );
        break;
      }

      case 'ended':
        break;
    }

    return clearTimers;
  }, [phase, turnIndex, muted, agentId, callId, clearTimers, schedule, patch]);

  // ---- Call timer --------------------------------------------------------
  const connectedAt = call?.connectedAt ?? null;
  useEffect(() => {
    if (connectedAt === null || phase === 'ended') return;
    const tick = () => patch(() => ({ elapsedSeconds: Math.floor((Date.now() - connectedAt) / 1000) }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [connectedAt, phase, patch]);

  useEffect(() => clearTimers, [clearTimers]);

  // ---- Actions -----------------------------------------------------------
  const start = useCallback(
    (nextAgentId: string, options: { video?: boolean } = {}) => {
      clearTimers();
      startedAtRef.current = Date.now();
      setCall({
        id: `call-${startedAtRef.current}`,
        agentId: nextAgentId,
        phase: 'connecting',
        connectedAt: null,
        elapsedSeconds: 0,
        muted: false,
        speaker: false,
        recording: false,
        video: !!options.video,
        facing: 'front',
        caption: null,
        transcript: [],
        turnIndex: 0,
      });
    },
    [clearTimers],
  );

  const end = useCallback(() => {
    clearTimers();
    setCall((prev) => {
      if (!prev || prev.phase === 'ended') return prev;
      const durationSeconds = prev.connectedAt ? Math.floor((Date.now() - prev.connectedAt) / 1000) : 0;
      onEndedRef.current?.({
        id: prev.id,
        agentId: prev.agentId,
        startedAt: startedAtRef.current,
        durationSeconds,
        connected: prev.connectedAt !== null,
        recorded: prev.recording,
        transcript: prev.transcript,
      });
      return { ...prev, phase: 'ended', caption: null, video: false, elapsedSeconds: durationSeconds };
    });
  }, [clearTimers]);

  /** Removes an ended call from memory (after the "Call ended" moment). */
  const dismiss = useCallback(() => {
    clearTimers();
    setCall((prev) => (prev?.phase === 'ended' ? null : prev));
  }, [clearTimers]);

  const toggleMute = useCallback(() => patch((prev) => ({ muted: !prev.muted })), [patch]);
  const toggleSpeaker = useCallback(() => patch((prev) => ({ speaker: !prev.speaker })), [patch]);
  const toggleRecording = useCallback(() => patch((prev) => ({ recording: !prev.recording })), [patch]);
  const setVideo = useCallback((video: boolean) => patch(() => ({ video })), [patch]);
  const flipCamera = useCallback(
    () => patch((prev) => ({ facing: prev.facing === 'front' ? 'back' : 'front' })),
    [patch],
  );

  const scriptFinished =
    !!call && call.phase === 'listening' && call.turnIndex >= (getAgent(call.agentId)?.script.length ?? 0);

  return {
    call,
    scriptFinished,
    start,
    end,
    dismiss,
    toggleMute,
    toggleSpeaker,
    toggleRecording,
    setVideo,
    flipCamera,
  };
}

export type MockCallController = ReturnType<typeof useMockCall>;
