import { useEffect, useState } from 'react';

/**
 * Mimics a network fetch on first mount so loading states are visible in the
 * prototype. Replace with real query state once the API is connected.
 */
export function useSimulatedLoading(delay = 550): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loading;
}
