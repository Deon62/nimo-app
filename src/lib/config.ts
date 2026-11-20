/** Public runtime config. Set in .env.local (see .env.example). */
export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL || 'https://nimo-app-backend.onrender.com').replace(/\/$/, ''),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
};

export const supabaseConfigured = !!config.supabaseUrl && !!config.supabaseKey;
