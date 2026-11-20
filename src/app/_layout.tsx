import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountProvider } from '@/state/AccountContext';
import { ActiveCallProvider } from '@/state/ActiveCallContext';
import { CallHistoryProvider } from '@/state/CallHistoryContext';
import { PreferencesProvider } from '@/state/PreferencesContext';
import { StoriesProvider } from '@/state/StoriesContext';
import { VoicePreviewProvider } from '@/state/VoicePreviewContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <PreferencesProvider>
          <StoriesProvider>
            <VoicePreviewProvider>
              <CallHistoryProvider>
                <ActiveCallProvider>
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: colors.background.primary },
                    }}
                  >
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
                    <Stack.Screen name="settings/[section]" />
                    <Stack.Screen name="settings/index" />
                    <Stack.Screen name="profile/edit" />
                    <Stack.Screen name="payment-methods/index" />
                    <Stack.Screen name="payment-methods/add" />
                    <Stack.Screen name="payment-methods/mpesa" />
                    <Stack.Screen name="checkout/[plan]" />
                  </Stack>
                </ActiveCallProvider>
              </CallHistoryProvider>
            </VoicePreviewProvider>
          </StoriesProvider>
        </PreferencesProvider>
      </AccountProvider>
    </SafeAreaProvider>
  );
}
