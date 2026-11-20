import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { AuthSwitch, isEmail, OrDivider, PasswordField, SocialRow } from '@/components/AuthBits';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Mascot } from '@/components/illustrations/Mascot';
import { useSocialSignIn } from '@/hooks/useSocialSignIn';
import { useAccount } from '@/state/AccountContext';
import { useAuth } from '@/state/AuthContext';
import { colors, screenPadding, spacing } from '@/theme';

export function SignInScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { profile } = useAccount();
  const social = useSocialSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const errors = {
    email: isEmail(email) ? undefined : 'Enter a valid email',
    password: password.length >= 6 ? undefined : 'At least 6 characters',
  };

  const logIn = () => {
    setSubmitted(true);
    if (errors.email || errors.password) return;
    setBusy(true);
    // Mock: any well-formed email and password signs in.
    setTimeout(() => signIn('email'), 800);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + spacing.xl, paddingBottom: bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Mascot size={112} waving />
          <AppText variant="largeTitle" align="center">
            Welcome back
          </AppText>
          <AppText variant="callout" tone="secondary" align="center">
            Nimo missed you{profile.firstName ? `, ${profile.firstName}` : ''}.
          </AppText>
        </View>

        <SocialRow onPick={social.pick} loading={social.loading} disabled={busy} />
        <OrDivider label="or with email" />

        <View style={styles.fields}>
          <FormField
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setResetSent(false);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={submitted ? errors.email : undefined}
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={logIn}
            error={submitted ? errors.password : undefined}
          />
          <Pressable
            onPress={() => (isEmail(email) ? setResetSent(true) : setSubmitted(true))}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.forgot}
          >
            <AppText variant="footnote" weight="600" tone={resetSent ? 'secondary' : 'primary'}>
              {resetSent ? 'Reset link sent ✓' : 'Forgot password?'}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Button label="Log in" size="large" onPress={logIn} loading={busy} />
          <AuthSwitch prompt="New to Nimo?" action="Sign up" onPress={() => router.replace('/sign-up')} />
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
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm },
  footer: { marginTop: 'auto', gap: spacing.sm },
});
