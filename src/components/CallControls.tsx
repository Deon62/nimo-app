import { StyleSheet, View } from 'react-native';
import { CircleDot, Lock, Mic, MicOff, PhoneOff, Video, VideoOff, Volume2, type LucideIcon } from 'lucide-react-native';

import { colors, fontFamily } from '@/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const SIZE = 62;
const END_SIZE = 72;

interface ControlProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  locked?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function Control({ icon: Icon, label, active, locked, disabled, onPress, accessibilityLabel }: ControlProps) {
  return (
    <View style={styles.control}>
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: !!active, disabled: !!disabled }}
        activeScale={0.92}
        activeOpacity={0.8}
        style={[styles.circle, active ? styles.circleOn : styles.circleOff, disabled && styles.disabled]}
      >
        <Icon size={24} color={active ? colors.ink : '#FFFFFF'} strokeWidth={1.8} />
        {locked && (
          <View style={styles.lock}>
            <Lock size={10} color={colors.ink} strokeWidth={2.6} />
          </View>
        )}
      </PressableScale>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

interface CallControlsProps {
  muted: boolean;
  video: boolean;
  speaker: boolean;
  recording: boolean;
  /** Recording is a paid-plan feature. */
  recordingLocked: boolean;
  disabled?: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  onRecord: () => void;
  onEnd: () => void;
}

export function CallControls({
  muted,
  video,
  speaker,
  recording,
  recordingLocked,
  disabled,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onRecord,
  onEnd,
}: CallControlsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Control
          icon={muted ? MicOff : Mic}
          label={muted ? 'Unmute' : 'Mute'}
          active={muted}
          disabled={disabled}
          onPress={onToggleMute}
          accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
        />
        <Control
          icon={video ? Video : VideoOff}
          label="Video"
          active={video}
          disabled={disabled}
          onPress={onToggleVideo}
          accessibilityLabel={video ? 'Turn camera off' : 'Turn camera on'}
        />
        <Control
          icon={CircleDot}
          label={recording ? 'Stop' : 'Record'}
          active={recording}
          locked={recordingLocked}
          disabled={disabled}
          onPress={onRecord}
          accessibilityLabel={
            recordingLocked ? 'Record call, available on paid plans' : recording ? 'Stop recording' : 'Record call'
          }
        />
        <Control
          icon={Volume2}
          label="Speaker"
          active={speaker}
          disabled={disabled}
          onPress={onToggleSpeaker}
          accessibilityLabel={speaker ? 'Turn speaker off' : 'Turn speaker on'}
        />
      </View>
      <PressableScale
        onPress={onEnd}
        disabled={disabled}
        accessibilityLabel="End call"
        activeScale={0.92}
        style={[styles.end, disabled && styles.disabled]}
      >
        <PhoneOff size={30} color="#FFFFFF" strokeWidth={2} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 340 },
  control: { alignItems: 'center', gap: 8, width: 76 },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  circleOff: { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  circleOn: { backgroundColor: '#FFFFFF' },
  lock: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  end: {
    width: END_SIZE,
    height: END_SIZE,
    borderRadius: END_SIZE / 2,
    backgroundColor: colors.accent.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  label: { color: 'rgba(255, 255, 255, 0.7)', fontFamily },
});
