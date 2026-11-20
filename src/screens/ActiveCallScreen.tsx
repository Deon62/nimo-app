import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronDown, Ellipsis } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { CallControls } from '@/components/CallControls';
import { CallOptionsSheet } from '@/components/CallOptionsSheet';
import { PressableScale } from '@/components/PressableScale';
import { VoiceOrb } from '@/components/VoiceOrb';
import { getAgent } from '@/data/agents';
import type { CallPhase, CallState } from '@/hooks/useVoiceCall';
import { useAccount } from '@/state/AccountContext';
import { useActiveCall } from '@/state/ActiveCallContext';
import { usePreferences } from '@/state/PreferencesContext';
import { colors, fontFamily, hitTarget, screenPadding, spacing } from '@/theme';
import { formatDuration } from '@/utils/format';

const phaseLabel: Record<CallPhase, string> = {
  connecting: 'Connecting…',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  ended: 'Call ended',
};

const ENDED_HOLD_MS = 1400;
const CAPTIONS_KEY = 'calling.captions';

interface Notice {
  text: string;
  action?: { label: string; onPress: () => void };
}

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function captionFor(call: CallState, agentName: string): { who: string; text: string; muted?: boolean } | null {
  if (call.error) return { who: 'Call ended', text: call.error, muted: true };
  if (call.phase === 'ended' || call.phase === 'connecting') return null;
  if (call.caption) {
    return { who: call.caption.speaker === 'user' ? 'You' : agentName, text: call.caption.text };
  }
  if (call.phase === 'listening' && call.muted) {
    return { who: 'Muted', text: 'Microphone off', muted: true };
  }
  return null;
}

/** Pulsing red "REC" badge. */
function RecordingBadge() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(0.25, { duration: 700 }), -1, true));
  }, [pulse]);
  const dot = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={styles.rec}>
      <Animated.View style={[styles.recDot, dot]} />
      <AppText variant="caption" weight="600" style={styles.recText}>
        REC
      </AppText>
    </Animated.View>
  );
}

export function ActiveCallScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { call, end, dismiss, toggleMute, toggleSpeaker, toggleRecording, setVideo, flipCamera } = useActiveCall();
  const { get, set } = usePreferences();
  const { canRecordCalls } = useAccount();
  const [permission, requestPermission] = useCameraPermissions();
  const agent = getAgent(call?.agentId);
  const phase = call?.phase;
  const wantsVideo = !!call?.video;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCaptions = get(CAPTIONS_KEY, true);

  const showNotice = (next: Notice) => {
    setNotice(next);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    if (phase !== 'ended') return;
    const t = setTimeout(
      () => {
        dismiss();
        leave();
      },
      call?.error ? ENDED_HOLD_MS * 3 : ENDED_HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [phase, dismiss, call?.error]);

  useEffect(() => {
    if (!call) {
      const t = setTimeout(leave, 0);
      return () => clearTimeout(t);
    }
  }, [call]);

  // A call started as a video call still needs camera permission.
  useEffect(() => {
    if (!wantsVideo || !permission || permission.granted) return;
    let cancelled = false;
    void (permission.canAskAgain ? requestPermission() : Promise.resolve(permission)).then((result) => {
      if (cancelled || result.granted) return;
      setVideo(false);
      setNotice({ text: 'Camera access is off' });
    });
    return () => {
      cancelled = true;
    };
  }, [wantsVideo, permission, requestPermission, setVideo]);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  if (!call || !agent) {
    return <View style={styles.screen} />;
  }

  const onRecord = () => {
    if (canRecordCalls) {
      toggleRecording();
      return;
    }
    showNotice({
      text: 'Recording is on paid plans',
      action: {
        label: 'View plans',
        onPress: () => {
          setNotice(null);
          router.push('/plans');
        },
      },
    });
  };

  const onToggleVideo = async () => {
    if (call.video) {
      setVideo(false);
      return;
    }
    const result = permission?.granted ? permission : await requestPermission();
    if (result.granted) {
      setVideo(true);
      return;
    }
    showNotice({
      text: 'Camera access is off',
      action: Platform.OS === 'web' ? undefined : { label: 'Settings', onPress: () => void Linking.openSettings() },
    });
  };

  const caption = showCaptions || call.error ? captionFor(call, agent.name) : null;
  const ended = call.phase === 'ended';
  const status = call.muted && call.phase === 'listening' ? 'Muted' : phaseLabel[call.phase];
  const videoOn = call.video && !!permission?.granted && !ended;

  const captionContent = caption && (
    <Animated.View key={caption.text} entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)}>
      <AppText variant="caption" weight="600" align={videoOn ? 'left' : 'center'} style={styles.captionWho}>
        {caption.who.toUpperCase()}
      </AppText>
      <AppText
        variant="callout"
        align={videoOn ? 'left' : 'center'}
        numberOfLines={3}
        style={[styles.captionText, videoOn && styles.captionTextVideo, caption.muted && styles.captionMuted]}
      >
        {caption.text}
      </AppText>
    </Animated.View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {videoOn && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
          <CameraView style={StyleSheet.absoluteFill} facing={call.facing} mirror={call.facing === 'front'} />
          <View style={[styles.scrim, styles.scrimTop]} />
          <View style={[styles.scrim, styles.scrimBottom]} />
        </Animated.View>
      )}

      <View
        style={[
          styles.body,
          { paddingTop: top + spacing.sm, paddingBottom: Math.max(bottom, spacing.xl) + spacing.sm },
        ]}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <PressableScale
            onPress={leave}
            disabled={ended}
            accessibilityLabel="Minimise call"
            style={styles.roundButton}
            activeScale={0.92}
          >
            <ChevronDown size={22} color="#FFFFFF" strokeWidth={2} />
          </PressableScale>
          <AppText variant="label" style={styles.callLabel}>
            {videoOn ? 'VIDEO CALL' : 'NIMO CALL'}
          </AppText>
          <PressableScale
            onPress={() => setOptionsOpen(true)}
            disabled={ended}
            accessibilityLabel="Call options"
            style={styles.roundButton}
            activeScale={0.92}
          >
            <Ellipsis size={22} color="#FFFFFF" strokeWidth={2} />
          </PressableScale>
        </View>

        {/* Who you're talking to */}
        <View style={styles.identity}>
          <AgentAvatar agent={agent} size={56} />
          <AppText variant="title" tone="inverse" align="center" style={styles.name}>
            {agent.name}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="subhead" align="center" style={styles.meta}>
              {call.connectedAt || ended ? `${formatDuration(call.elapsedSeconds)}  ·  ${status}` : status}
            </AppText>
            {call.recording && !ended && <RecordingBadge />}
          </View>
        </View>

        {videoOn ? (
          <View style={styles.videoSpacer} />
        ) : (
          <View style={styles.centre}>
            <VoiceOrb phase={call.phase} muted={call.muted} tone={agent.tone} size={300} />
          </View>
        )}

        <View style={[styles.captionBox, videoOn && styles.captionBoxVideo]} accessibilityLiveRegion="polite">
          {notice ? (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutDown.duration(180)}
              style={styles.notice}
            >
              <AppText variant="subhead" weight="500" tone="inverse" style={styles.noticeText}>
                {notice.text}
              </AppText>
              {notice.action && (
                <Pressable onPress={notice.action.onPress} hitSlop={10} accessibilityRole="button">
                  <AppText variant="subhead" weight="600" style={styles.noticeAction}>
                    {notice.action.label}
                  </AppText>
                </Pressable>
              )}
            </Animated.View>
          ) : videoOn ? (
            <View style={styles.videoChip}>
              <VoiceOrb phase={call.phase} muted={call.muted} tone={agent.tone} size={40} halo={false} />
              <View style={styles.flex}>
                {captionContent || (
                  <AppText variant="subhead" style={styles.captionTextVideo}>
                    {status}
                  </AppText>
                )}
              </View>
            </View>
          ) : (
            captionContent
          )}
        </View>

        <CallControls
          muted={call.muted}
          video={call.video}
          speaker={call.speaker}
          recording={call.recording}
          recordingLocked={!canRecordCalls}
          disabled={ended}
          onToggleMute={toggleMute}
          onToggleVideo={() => void onToggleVideo()}
          onToggleSpeaker={toggleSpeaker}
          onRecord={onRecord}
          onEnd={end}
        />
      </View>

      <CallOptionsSheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        captions={showCaptions}
        onCaptionsChange={(value) => set(CAPTIONS_KEY, value)}
        speaker={call.speaker}
        onSpeakerChange={toggleSpeaker}
        onFlipCamera={videoOn ? flipCamera : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark.surface },
  body: { flex: 1, paddingHorizontal: screenPadding },
  scrim: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  scrimTop: { top: 0, height: 230 },
  scrimBottom: { bottom: 0, height: 300 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: {
    width: hitTarget - 4,
    height: hitTarget - 4,
    borderRadius: (hitTarget - 4) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callLabel: { color: 'rgba(255, 255, 255, 0.6)', fontFamily },
  identity: { alignItems: 'center', marginTop: spacing.lg },
  name: { marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  meta: { color: 'rgba(255, 255, 255, 0.65)', fontVariant: ['tabular-nums'] },
  rec: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.danger },
  recText: { color: '#FFFFFF', letterSpacing: 1, fontFamily },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoSpacer: { flex: 1 },
  captionBox: { minHeight: 92, width: '100%', maxWidth: 360, alignSelf: 'center', marginBottom: spacing.xl },
  captionBoxVideo: { minHeight: 0, maxWidth: 420 },
  captionWho: { color: 'rgba(255, 255, 255, 0.45)', letterSpacing: 0.8, marginBottom: 6, fontFamily },
  captionText: { color: '#FFFFFF', fontSize: 17, lineHeight: 24 },
  captionTextVideo: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },
  captionMuted: { color: 'rgba(255, 255, 255, 0.6)' },
  videoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 28, 30, 0.72)',
  },
  flex: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  noticeText: { flex: 1 },
  noticeAction: { color: '#FFFFFF', textDecorationLine: 'underline' },
});
