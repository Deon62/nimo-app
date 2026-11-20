import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { goBackOr, ScreenHeader } from '@/components/ScreenHeader';
import { usePickPhoto } from '@/hooks/usePickPhoto';
import { errorMessage } from '@/lib/api';
import { useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditProfileScreen() {
  const { bottom } = useSafeAreaInsets();
  const { profile, updateProfile, setAvatar } = useAccount();
  const pickPhoto = usePickPhoto();
  const [draft, setDraft] = useState(profile);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    firstName: draft.firstName.trim() ? undefined : 'Enter your first name',
    email: EMAIL.test(draft.email.trim()) ? undefined : 'Enter a valid email',
  };
  const valid = !errors.firstName && !errors.email;
  const changed = (Object.keys(draft) as (keyof typeof draft)[]).some((k) => draft[k] !== profile[k]);
  const set = (key: keyof typeof draft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSubmitted(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      });
      if (draft.avatarUri !== profile.avatarUri) await setAvatar(draft.avatarUri);
      goBackOr('/profile');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Account details" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photo}>
          <UserAvatar name={draft.firstName || '?'} uri={draft.avatarUri} size={104} />
          <View style={styles.photoActions}>
            <Pressable
              onPress={async () => {
                const uri = await pickPhoto();
                if (uri) setDraft((d) => ({ ...d, avatarUri: uri }));
              }}
              hitSlop={8}
              accessibilityRole="button"
            >
              <AppText variant="subhead" weight="600">
                {draft.avatarUri ? 'Change photo' : 'Add photo'}
              </AppText>
            </Pressable>
            {draft.avatarUri && (
              <Pressable
                onPress={() => setDraft((d) => ({ ...d, avatarUri: null }))}
                hitSlop={8}
                accessibilityRole="button"
              >
                <AppText variant="subhead" tone="secondary">
                  Remove
                </AppText>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.fields}>
          <View style={styles.nameRow}>
            <FormField
              label="First name"
              value={draft.firstName}
              onChangeText={set('firstName')}
              autoComplete="given-name"
              textContentType="givenName"
              error={submitted ? errors.firstName : undefined}
            />
            <FormField
              label="Last name"
              value={draft.lastName}
              onChangeText={set('lastName')}
              autoComplete="family-name"
              textContentType="familyName"
            />
          </View>
          <FormField
            label="Email"
            value={draft.email}
            onChangeText={set('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={submitted ? errors.email : undefined}
          />
          <FormField
            label="Phone"
            value={draft.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>

        {error ? (
          <AppText variant="footnote" tone="danger" align="center">
            {error}
          </AppText>
        ) : null}
        <Button label="Save" size="large" onPress={save} disabled={!changed} loading={busy} style={styles.save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    gap: spacing.xxxl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  photo: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.md },
  photoActions: { flexDirection: 'row', gap: spacing.xxl },
  fields: { gap: spacing.xxl },
  nameRow: { flexDirection: 'row', gap: spacing.lg },
  save: { marginTop: 'auto' },
});
