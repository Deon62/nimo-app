import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountProvider } from '@/state/AccountContext';
import { AuthProvider, useAuth } from '@/state/AuthContext';
import { ActiveCallProvider } from '@/state/ActiveCallContext';
import { CallHistoryProvider } from '@/state/CallHistoryContext';
import { PreferencesProvider } from '@/state/PreferencesContext';
import { StoriesProvider } from '@/state/StoriesContext';
import { VoicePreviewProvider } from '@/state/VoicePreviewContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AccountProvider>
          <PreferencesProvider>
            <StoriesProvider>
              <VoicePreviewProvider>
                <CallHistoryProvider>
                  <ActiveCallProvider>
                    <StatusBar style="dark" />
                    <RootStack />
                  </ActiveCallProvider>
                </CallHistoryProvider>
              </VoicePreviewProvider>
            </StoriesProvider>
          </PreferencesProvider>
        </AccountProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** Onboarding → sign in → app. Protected groups redirect automatically when auth state changes. */
function RootStack() {
  const { ready, onboarded, session } = useAuth();
  if (!ready) return null;
  const signedIn = !!session;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      <Stack.Protected guard={!signedIn && !onboarded}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn && onboarded}>
        <Stack.Screen name="(auth)/sign-in" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)/sign-up" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)/sign-in-phone" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="agent/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="call"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
            contentStyle: { backgroundColor: colors.dark.surface },
          }}
        />
        <Stack.Screen name="call-history/[id]" />
        <Stack.Screen name="call-history/transcript/[id]" />
        <Stack.Screen name="settings/[section]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="payment-methods/index" />
        <Stack.Screen name="payment-methods/add" />
        <Stack.Screen name="payment-methods/mpesa" />
        <Stack.Screen name="checkout/[plan]" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="story/[id]" />
        <Stack.Screen name="payment-complete" />
      </Stack.Protected>
      {/* Email links (confirm / reset password) work signed in or out. */}
      <Stack.Screen name="verify" />
    </Stack>
  );
}
