import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface StoriesValue {
  seen: ReadonlySet<string>;
  markSeen: (agentId: string) => void;
}

const StoriesContext = createContext<StoriesValue | null>(null);

export function StoriesProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const markSeen = useCallback((agentId: string) => {
    setSeen((prev) => (prev.has(agentId) ? prev : new Set(prev).add(agentId)));
  }, []);
  const value = useMemo(() => ({ seen, markSeen }), [seen, markSeen]);
  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export function useStories(): StoriesValue {
  const ctx = useContext(StoriesContext);
  if (!ctx) throw new Error('useStories must be used inside StoriesProvider');
  return ctx;
}
