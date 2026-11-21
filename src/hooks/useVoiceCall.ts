import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  type AudioSource,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import type { TranscriptLine } from '@/data/calls';
import { voicePreviewSource } from '@/data/voicePreviews';
import { api, errorMessage } from '@/lib/api';

/**
 * A real voice call, one turn at a time:
 * listen (record until the caller pauses) -> thinking (speech-to-text + DeepSeek + ElevenLabs
 * on the API) -> speaking (play the reply) -> listen again. The mic is off while the agent
 * speaks, so the agent never hears itself.
 */

export type CallPhase = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended';

export interface CallState {
  /** Server call id once connected; a local id while connecting. */
  id: string;
  agentId: string;
  phase: CallPhase;
  /** Epoch ms when the call connected; null while connecting. */
  connectedAt: number | null;
  elapsedSeconds: number;
  muted: boolean;
  speaker: boolean;
  /** Paid-plan feature; when on, the API stores both sides of each turn. */
  recording: boolean;
  /** Camera preview on. */
  video: boolean;
  facing: 'front' | 'back';
  /** The line currently being heard or spoken. */
  caption: TranscriptLine | null;
  transcript: TranscriptLine[];
  /** Why the call couldn't start or stopped (no mic access, daily limit, offline...). */
  error: string | null;
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

interface StartResponse {
  call_id: string;
  greeting: string;
  minutes_left_today: number | null;
}

interface TurnResponse {
  transcript: string;
  reply: string | null;
  audio_base64: string | null;
  audio_mime: string | null;
  /** The caller asked to hang up: play the goodbye, then end the call. */
  end_call?: boolean;
}

/** Voice-activity detection, in dBFS from the recorder's meter. */
const VAD = {
  speech: -38,
  /** Pause that ends the caller's turn. */
  silenceMs: 1100,
  /** Ignore blips shorter than this. */
  minSpeechMs: 350,
  /** Restart an idle recording so files stay small. */
  idleRestartMs: 20000,
  maxTurnMs: 30000,
  /** Without a meter (some browsers), send what was said every few seconds. */
  noMeterTurnMs: 6000,
  pollMs: 120,
} as const;

const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/**
 * Audio mode for a call. Always pass the whole mode: on iOS, fields left out reset to false, so
 * setting only the speaker route would also turn `allowsRecording` off and break the mic.
 */
const callAudioMode = (speaker: boolean) =>
  setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, shouldRouteThroughEarpiece: !speaker }).catch(
    () => {},
  );

interface Options {
  onCallEnded?: (call: CompletedCall) => void;
}

export function useVoiceCall({ onCallEnded }: Options = {}) {
  const [call, setCall] = useState<CallState | null>(null);
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const player = useAudioPlayer(null);

  const callRef = useRef<CallState | null>(null);
  /** Bumped on every start/end: async work from an old call checks it and stops. */
  const token = useRef(0);
  const startedAt = useRef(0);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingActive = useRef(false);
  const afterPlayback = useRef<(() => void) | null>(null);
  const replyFile = useRef<File | null>(null);
  const onEndedRef = useRef(onCallEnded);

  useLayoutEffect(() => {
    onEndedRef.current = onCallEnded;
    callRef.current = call;
  });

  const patch = useCallback((update: Partial<CallState> | ((prev: CallState) => Partial<CallState>)) => {
    setCall((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...(typeof update === 'function' ? update(prev) : update) };
      callRef.current = next;
      return next;
    });
  }, []);

  // ---- Audio plumbing ------------------------------------------------------------------------

  const stopPolling = () => {
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  };

  const stopRecording = useCallback(async (): Promise<string | null> => {
    stopPolling();
    if (!recordingActive.current) return null;
    recordingActive.current = false;
    try {
      await recorder.stop();
      return recorder.uri;
    } catch {
      return null;
    }
  }, [recorder]);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      const next = afterPlayback.current;
      afterPlayback.current = null;
      next?.();
    });
    return () => sub.remove();
  }, [player]);

  /** Plays a reply; `done` runs when it finishes. */
  const play = useCallback(
    async (source: string | AudioSource, done: () => void) => {
      afterPlayback.current = done;
      player.replace(typeof source === 'string' ? { uri: source } : source);
      player.play();
    },
    [player],
  );

  const playBase64 = useCallback(
    async (b64: string, mime: string, done: () => void) => {
      if (Platform.OS === 'web') {
        await play(`data:${mime};base64,${b64}`, done);
        return;
      }
      replyFile.current?.delete?.();
      const file = new File(Paths.cache, `nimo-reply-${Date.now()}.mp3`);
      file.create({ overwrite: true });
      await file.write(b64, { encoding: 'base64' });
      replyFile.current = file;
      await play(file.uri, done);
    },
    [play],
  );

  // ---- Turn loop -----------------------------------------------------------------------------

  const fail = useCallback(
    (message: string) => {
      token.current += 1;
      void stopRecording();
      player.pause();
      patch({ phase: 'ended', error: message, caption: null, video: false });
    },
    [patch, player, stopRecording],
  );

  /** `end` is defined further down; the agent hangs up through this ref. */
  const endRef = useRef<() => void>(() => {});
  // `listen` and `sendTurn` call each other, so they share a ref.
  const listenRef = useRef<() => void>(() => {});

  const sendTurn = useCallback(
    async (uri: string, mine: number) => {
      const current = callRef.current;
      if (!current || token.current !== mine) return;
      patch({ phase: 'thinking' });
      try {
        const form = new FormData();
        if (Platform.OS === 'web') {
          const blob = await (await fetch(uri)).blob();
          form.append('audio', blob, blob.type.includes('webm') ? 'speech.webm' : 'speech.m4a');
        } else {
          // Expo's fetch reads parts that expose `bytes()` (expo-file-system File), not the old
          // React Native `{ uri, name, type }` descriptor ("Unsupported FormDataPart implementation").
          form.append('audio', new File(uri) as unknown as Blob);
        }
        const res = await api<TurnResponse>(`/calls/${current.id}/voice`, { method: 'POST', body: form });
        if (token.current !== mine) return;
        if (!res.transcript || !res.reply) {
          listenRef.current();
          return;
        }
        const userLine: TranscriptLine = { speaker: 'user', text: res.transcript };
        const agentLine: TranscriptLine = { speaker: 'agent', text: res.reply };
        patch((prev) => ({ phase: 'speaking', caption: agentLine, transcript: [...prev.transcript, userLine] }));
        const finished = () => {
          if (token.current !== mine) return;
          patch((prev) => ({ caption: null, transcript: [...prev.transcript, agentLine] }));
          if (!res.end_call) {
            listenRef.current();
            return;
          }
          // A short beat after the goodbye (and lets the goodbye land in the transcript), then hang up.
          setTimeout(() => {
            if (token.current === mine) endRef.current();
          }, 400);
        };
        if (res.audio_base64) await playBase64(res.audio_base64, res.audio_mime ?? 'audio/mpeg', finished);
        else finished();
      } catch (e) {
        if (token.current !== mine) return;
        fail(errorMessage(e));
      }
    },
    [patch, playBase64, fail],
  );

  const listen = useCallback(async () => {
    const mine = token.current;
    const current = callRef.current;
    if (!current || current.phase === 'ended') return;
    patch({ phase: 'listening', caption: null });
    if (current.muted) return;

    try {
      try {
        await recorder.prepareToRecordAsync();
      } catch {
        // Something (another player, an interruption) may have switched recording off: turn it back on once.
        await callAudioMode(!!callRef.current?.speaker);
        await recorder.prepareToRecordAsync();
      }
      if (token.current !== mine || callRef.current?.muted) return;
      recorder.record();
      recordingActive.current = true;
    } catch (e) {
      console.warn('[call] microphone failed to start', e);
      fail('Couldn’t use the microphone.');
      return;
    }

    const began = Date.now();
    let speechStart: number | null = null;
    let lastLoud = 0;
    stopPolling();
    poll.current = setInterval(() => {
      if (token.current !== mine) {
        stopPolling();
        return;
      }
      const now = Date.now();
      const level = recorder.getStatus().metering;
      let done = false;
      if (level === undefined || level === null) {
        done = now - began > VAD.noMeterTurnMs;
      } else if (level > VAD.speech) {
        speechStart ??= now;
        lastLoud = now;
      } else if (speechStart !== null && now - lastLoud > VAD.silenceMs) {
        if (lastLoud - speechStart >= VAD.minSpeechMs) done = true;
        else speechStart = null;
      }
      if (speechStart !== null && now - speechStart > VAD.maxTurnMs) done = true;

      if (done) {
        void stopRecording().then((uri) => (uri ? sendTurn(uri, mine) : listenRef.current()));
      } else if (speechStart === null && now - began > VAD.idleRestartMs) {
        void stopRecording().then(() => listenRef.current());
      }
    }, VAD.pollMs);
  }, [patch, recorder, fail, stopRecording, sendTurn]);

  useLayoutEffect(() => {
    listenRef.current = () => void listen();
  }, [listen]);

  // ---- Call timer ----------------------------------------------------------------------------
  const connectedAt = call?.connectedAt ?? null;
  const phase = call?.phase;
  useEffect(() => {
    if (connectedAt === null || phase === 'ended') return;
    const tick = () => patch({ elapsedSeconds: Math.floor((Date.now() - connectedAt) / 1000) });
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [connectedAt, phase, patch]);

  // ---- Actions -------------------------------------------------------------------------------

  const start = useCallback(
    async (agentId: string, options: { video?: boolean } = {}) => {
      const mine = ++token.current;
      await stopRecording();
      player.pause();
      startedAt.current = Date.now();
      const initial: CallState = {
        id: `local-${startedAt.current}`,
        agentId,
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
        error: null,
      };
      callRef.current = initial;
      setCall(initial);

      const permission = await requestRecordingPermissionsAsync().catch(() => null);
      if (token.current !== mine) return;
      if (!permission?.granted) {
        fail('Allow microphone access in Settings to talk to Nimo.');
        return;
      }
      await callAudioMode(false);

      try {
        const res = await api<StartResponse>('/calls', { method: 'POST', json: { agent_id: agentId } });
        if (token.current !== mine) {
          // Hung up while connecting.
          void api(`/calls/${res.call_id}/end`, { method: 'POST', json: { duration_seconds: 0 } }).catch(() => {});
          return;
        }
        const greeting: TranscriptLine = { speaker: 'agent', text: res.greeting };
        patch({ id: res.call_id, connectedAt: Date.now(), phase: 'speaking', caption: greeting });
        await play(voicePreviewSource(agentId), () => {
          if (token.current !== mine) return;
          patch((prev) => ({ caption: null, transcript: [...prev.transcript, greeting] }));
          listenRef.current();
        });
      } catch (e) {
        if (token.current === mine) fail(errorMessage(e));
      }
    },
    [patch, play, player, fail, stopRecording],
  );

  const end = useCallback(() => {
    const prev = callRef.current;
    if (!prev || prev.phase === 'ended') return;
    token.current += 1;
    afterPlayback.current = null;
    void stopRecording();
    player.pause();
    const durationSeconds = prev.connectedAt ? Math.floor((Date.now() - prev.connectedAt) / 1000) : 0;
    const connected = prev.connectedAt !== null;
    if (connected) {
      void api(`/calls/${prev.id}/end`, { method: 'POST', json: { duration_seconds: durationSeconds } }).catch(
        () => {},
      );
    }
    onEndedRef.current?.({
      id: prev.id,
      agentId: prev.agentId,
      startedAt: startedAt.current,
      durationSeconds,
      connected,
      recorded: prev.recording,
      transcript: prev.transcript,
    });
    patch({ phase: 'ended', caption: null, video: false, elapsedSeconds: durationSeconds });
  }, [patch, player, stopRecording]);

  useLayoutEffect(() => {
    endRef.current = end;
  }, [end]);

  /** Removes an ended call from memory (after the "Call ended" moment). */
  const dismiss = useCallback(() => {
    setCall((prev) => (prev?.phase === 'ended' ? null : prev));
    replyFile.current?.delete?.();
    replyFile.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    const prev = callRef.current;
    if (!prev || prev.phase === 'ended') return;
    const muted = !prev.muted;
    patch({ muted });
    if (prev.phase !== 'listening') return;
    if (muted) void stopRecording();
    else listenRef.current();
  }, [patch, stopRecording]);

  const toggleSpeaker = useCallback(() => {
    const speaker = !callRef.current?.speaker;
    patch({ speaker });
    void callAudioMode(speaker);
  }, [patch]);

  const toggleRecording = useCallback(() => {
    const prev = callRef.current;
    if (!prev || !prev.connectedAt || prev.phase === 'ended') return;
    const recording = !prev.recording;
    patch({ recording });
    api(`/calls/${prev.id}`, { method: 'PATCH', json: { recorded: recording } }).catch(() =>
      patch({ recording: !recording }),
    );
  }, [patch]);

  const setVideo = useCallback((video: boolean) => patch({ video }), [patch]);
  const flipCamera = useCallback(
    () => patch((prev) => ({ facing: prev.facing === 'front' ? 'back' : 'front' })),
    [patch],
  );

  // Stop everything if the provider unmounts.
  useEffect(
    () => () => {
      token.current += 1;
      stopPolling();
    },
    [],
  );

  return { call, start, end, dismiss, toggleMute, toggleSpeaker, toggleRecording, setVideo, flipCamera };
}

export type VoiceCallController = ReturnType<typeof useVoiceCall>;
