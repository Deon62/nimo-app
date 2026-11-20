import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { seedCalls, type CallRecord } from '@/data/calls';

interface CallHistoryValue {
  calls: CallRecord[];
  addCall: (record: CallRecord) => void;
  clearHistory: () => void;
  removeCall: (id: string) => void;
  restoreSampleHistory: () => void;
  getCall: (id: string | undefined) => CallRecord | undefined;
}

const CallHistoryContext = createContext<CallHistoryValue | null>(null);

export function CallHistoryProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<CallRecord[]>(seedCalls);

  const addCall = useCallback((record: CallRecord) => {
    setCalls((prev) => [record, ...prev.filter((c) => c.id !== record.id)]);
  }, []);
  const clearHistory = useCallback(() => setCalls([]), []);
  const removeCall = useCallback((id: string) => setCalls((prev) => prev.filter((c) => c.id !== id)), []);
  const restoreSampleHistory = useCallback(() => setCalls(seedCalls), []);
  const getCall = useCallback((id: string | undefined) => calls.find((c) => c.id === id), [calls]);

  const value = useMemo(
    () => ({ calls, addCall, clearHistory, removeCall, restoreSampleHistory, getCall }),
    [calls, addCall, clearHistory, removeCall, restoreSampleHistory, getCall],
  );

  return <CallHistoryContext.Provider value={value}>{children}</CallHistoryContext.Provider>;
}

export function useCallHistory(): CallHistoryValue {
  const ctx = useContext(CallHistoryContext);
  if (!ctx) throw new Error('useCallHistory must be used inside CallHistoryProvider');
  return ctx;
}
