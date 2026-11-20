import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { config, supabaseConfigured } from './config';

/**
 * Supabase client (auth + profile + avatar storage). Sessions persist in AsyncStorage.
 * A placeholder URL keeps the app booting before keys are added; auth calls then fail with a clear message.
 */
export const supabase = createClient(
  supabaseConfigured ? config.supabaseUrl : 'https://not-configured.supabase.co',
  supabaseConfigured ? config.supabaseKey : 'not-configured',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh tokens only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const NOT_CONFIGURED_MESSAGE = 'Sign-in isn’t set up yet: add the Supabase keys to .env.local.';
