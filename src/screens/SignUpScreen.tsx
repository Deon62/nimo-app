import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { AuthSwitch, isEmail, OrDivider, PasswordField, SocialRow } from '@/components/AuthBits';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Mascot } from '@/components/illustrations/Mascot';
import { useSocialSignIn } from '@/hooks/useSocialSignIn';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/state/AuthContext';
import { colors, screenPadding, spacing } from '@/theme';

export function SignUpScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { signUpWithEmail } = useAuth();
  const social = useSocialSignIn();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const errors = {
    name: name.trim() ? undefined : 'What should Nimo call you?',
    email: isEmail(email) ? undefined : 'Enter a valid email',
    password: password.length >= 8 ? undefined : 'At least 8 characters',
  };

  const create = async () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    setError(null);
    const [firstName, ...rest] = name.trim().split(/\s+/);
    try {
      const result = await signUpWithEmail({ email, password, firstName, lastName: rest.join(' ') });
      if (result === 'confirm-email') {
        setCheckEmail(true);
        setBusy(false);
      }
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const shownError = error ?? social.error;

  const show = (e?: string) => (submitted ? e : undefined);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + spacing.xl, paddingBottom: bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Mascot size={96} />
          <AppText variant="largeTitle" align="center">
            Create your account
          </AppText>
          <AppText variant="callout" tone="secondary" align="center">
            It takes less than a minute.
          </AppText>
        </View>

        <SocialRow onPick={social.pick} loading={social.loading} disabled={busy} />
        <OrDivider label="or with email" />

        <View style={styles.fields}>
          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoComplete="name"
            textContentType="name"
            error={show(errors.name)}
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={show(errors.email)}
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="8 or more characters"
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={create}
            error={show(errors.password)}
          />
        </View>

        <View style={styles.footer}>
          {checkEmail ? (
            <AppText variant="footnote" tone="secondary" align="center">
              Check your email to confirm your account, then log in.
            </AppText>
          ) : shownError ? (
            <AppText variant="footnote" tone="danger" align="center">
              {shownError}
            </AppText>
          ) : null}
          <Button label="Create account" size="large" onPress={create} loading={busy} />
          <AppText variant="caption" tone="tertiary" align="center">
            By continuing you agree to the Terms and Privacy Policy.
          </AppText>
          <AuthSwitch prompt="Already have an account?" action="Log in" onPress={() => router.replace('/sign-in')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    gap: spacing.xxl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  head: { alignItems: 'center', gap: spacing.sm },
  fields: { gap: spacing.xl },
  footer: { marginTop: 'auto', gap: spacing.sm },
});
