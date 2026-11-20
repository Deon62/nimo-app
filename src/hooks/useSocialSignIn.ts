import { useState } from 'react';
import { router } from 'expo-router';

import type { SocialKind } from '@/components/SocialIcon';
import { useAuth } from '@/state/AuthContext';

const MOCK_DELAY_MS = 900;

/**
 * Google / Apple are simulated for now. Wire them to expo-auth-session (Google) and
 * expo-apple-authentication (Apple) plus the auth backend when it exists.
 */
export function useSocialSignIn() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState<SocialKind | null>(null);

  const pick = (kind: SocialKind) => {
    if (kind === 'phone') {
      router.push('/sign-in-phone');
      return;
    }
    setLoading(kind);
    setTimeout(() => {
      setLoading(null);
      signIn(kind);
    }, MOCK_DELAY_MS);
  };

  return { loading, pick };
}
