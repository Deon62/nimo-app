import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/state/AuthContext';
import { colors, screenPadding, spacing } from '@/theme';
import { digitsOnly } from '@/utils/digits';
import { formatKenyanPhone, maskPhone, normaliseKenyanPhone } from '@/utils/mpesa';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/** Mobile number sign-in through Supabase: number, then the 6-digit SMS code. */
export function PhoneSignInScreen() {
  const { bottom } = useSafeAreaInsets();
  const { sendPhoneCode, verifyPhoneCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'number' | 'code'>('number');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<TextInputInstance>(null);
  const normalised = normaliseKenyanPhone(phone);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    setSubmitted(true);
    if (!normalised) return;
    setBusy(true);
    setError(null);
    try {
      await sendPhoneCode(`+${normalised}`);
      setStep('code');
      setCode('');
      setResendIn(RESEND_SECONDS);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || !normalised) return;
    setBusy(true);
    setError(null);
    try {
      await verifyPhoneCode(`+${normalised}`, value);
    } catch (e) {
      setError(errorMessage(e));
      setCode('');
      setBusy(false);
    }
  };

  const onCode = (v: string) => {
    const next = digitsOnly(v).slice(0, CODE_LENGTH);
    setCode(next);
    if (next.length === CODE_LENGTH) verify(next);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader onBack={step === 'code' ? () => setStep('number') : undefined} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'number' ? (
          <>
            <View style={styles.head}>
              <AppText variant="largeTitle">Your number</AppText>
              <AppText variant="callout" tone="secondary">
                We’ll text you a code to log in.
              </AppText>
            </View>
            <FormField
              label="Mobile number"
              value={phone}
              onChangeText={(v) => setPhone(formatKenyanPhone(v))}
              placeholder="0712 345 678"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              autoFocus
              onSubmitEditing={sendCode}
              error={submitted && !normalised ? 'Enter a valid mobile number' : undefined}
            />
            <View style={styles.footer}>
              {error ? (
                <AppText variant="footnote" tone="danger" align="center">
                  {error}
                </AppText>
              ) : null}
              <Button label="Send code" size="large" onPress={sendCode} loading={busy} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.head}>
              <AppText variant="largeTitle">Enter the code</AppText>
              <AppText variant="callout" tone="secondary">
                Sent to {normalised ? maskPhone(normalised) : phone}.
              </AppText>
            </View>

            <Pressable onPress={() => codeRef.current?.focus()} style={styles.codeRow} accessible={false}>
              {Array.from({ length: CODE_LENGTH }, (_, i) => {
                const filled = i < code.length;
                const active = i === code.length;
                return (
                  <View key={i} style={[styles.box, filled && styles.boxFilled, active && styles.boxActive]}>
                    <AppText variant="title">{code[i] ?? ''}</AppText>
                  </View>
                );
              })}
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={onCode}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={CODE_LENGTH}
                autoFocus
                editable={!busy}
                accessibilityLabel="Verification code"
                caretHidden
                style={styles.hiddenInput}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                if (resendIn > 0) return;
                void sendCode();
              }}
              disabled={resendIn > 0}
              accessibilityRole="button"
              hitSlop={8}
            >
              <AppText variant="subhead" weight="600" tone={resendIn > 0 ? 'tertiary' : 'primary'}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </AppText>
            </Pressable>

            <View style={styles.footer}>
              {error ? (
                <AppText variant="footnote" tone="danger" align="center">
                  {error}
                </AppText>
              ) : null}
              <Button label="Continue" size="large" onPress={() => verify(code)} loading={busy} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xxl,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  head: { gap: spacing.sm },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  box: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 0.86,
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  boxFilled: { backgroundColor: '#FFFFFF', borderColor: colors.border },
  boxActive: { backgroundColor: '#FFFFFF', borderColor: colors.ink },
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0, color: 'transparent' } as object,
  footer: { marginTop: 'auto', gap: spacing.md },
});
