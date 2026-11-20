import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PasswordField } from '@/components/AuthBits';
import { Button } from '@/components/Button';
import { errorMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { sessionFromRedirect } from '@/state/AuthContext';
import { colors, screenPadding, spacing } from '@/theme';

/**
 * Return link from Supabase emails (nimo://verify): email confirmation or password reset.
 * Signs the user in from the link; a reset link then asks for a new password.
 */
export default function Verify() {
  const url = Linking.useLinkingURL();
  const { top, bottom } = useSafeAreaInsets();
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    sessionFromRedirect(url)
      .then(() => {
        if (!alive) return;
        if (url.includes('type=recovery')) setRecovery(true);
        else router.replace('/');
      })
      .catch(async (e) => {
        if (!alive) return;
        // Already handled (e.g. the sign-in browser passed the link on too).
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace('/');
        else setError(errorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [url]);

  const save = async () => {
    if (password.length < 8) {
      setError('At least 8 characters');
      return;
    }
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) setError(e.message);
    else router.replace('/');
  };

  if (!recovery) {
    return (
      <View style={[styles.screen, styles.center]}>
        {error ? (
          <View style={styles.gap}>
            <AppText variant="headline" align="center">
              This link didn’t work
            </AppText>
            <AppText variant="subhead" tone="secondary" align="center">
              {error}
            </AppText>
            <Button label="Back to log in" onPress={() => router.replace('/')} />
          </View>
        ) : (
          <ActivityIndicator color={colors.ink} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: top + spacing.xxxl, paddingBottom: bottom + spacing.lg }]}>
      <View style={styles.gap}>
        <AppText variant="largeTitle">New password</AppText>
        <PasswordField
          label="Password"
          value={password}
          onChangeText={setPassword}
          autoFocus
          error={error ?? undefined}
          onSubmitEditing={save}
        />
      </View>
      <Button label="Save password" size="large" onPress={save} loading={busy} style={styles.footer} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary, paddingHorizontal: screenPadding },
  center: { alignItems: 'center', justifyContent: 'center' },
  gap: { gap: spacing.lg, width: '100%', maxWidth: 420 },
  footer: { marginTop: 'auto' },
});
