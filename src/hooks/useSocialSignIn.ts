import { useState } from 'react';
import { router } from 'expo-router';

import { errorMessage } from '@/lib/api';
import type { SocialKind } from '@/components/SocialIcon';
import { useAuth } from '@/state/AuthContext';

/** Google and Apple sign in through Supabase in the browser; phone opens the code screen. */
export function useSocialSignIn() {
  const { signInWithProvider } = useAuth();
  const [loading, setLoading] = useState<SocialKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (kind: SocialKind) => {
    setError(null);
    if (kind === 'phone') {
      router.push('/sign-in-phone');
      return;
    }
    setLoading(kind);
    try {
      await signInWithProvider(kind);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  return { loading, error, pick };
}
