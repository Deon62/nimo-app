import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Captions, SwitchCamera, Volume2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { ListRow } from './ListRow';

interface CallOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  captions: boolean;
  onCaptionsChange: (value: boolean) => void;
  speaker: boolean;
  onSpeakerChange: (value: boolean) => void;
  /** Shown only while the camera is on. */
  onFlipCamera?: () => void;
}

/** In-call settings opened from the ⋯ button. */
export function CallOptionsSheet({
  visible,
  onClose,
  captions,
  onCaptionsChange,
  speaker,
  onSpeakerChange,
  onFlipCamera,
}: CallOptionsSheetProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { paddingBottom: Math.max(bottom, spacing.lg) + spacing.sm }]}>
        <View style={styles.handle} />
        <AppText variant="headline" align="center" style={styles.title}>
          Call options
        </AppText>
        <ListRow
          type="toggle"
          icon={Captions}
          label="Show captions"
          value={captions}
          onValueChange={onCaptionsChange}
        />
        <ListRow type="toggle" icon={Volume2} label="Speaker" value={speaker} onValueChange={onSpeakerChange} />
        {onFlipCamera && (
          <ListRow
            type="link"
            icon={SwitchCamera}
            label="Flip camera"
            onPress={() => {
              onFlipCamera();
              onClose();
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.sm },
});
