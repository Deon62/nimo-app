import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { CallRecord, CallStatus, TranscriptLine } from '@/data/calls';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface ApiCall {
  id: string;
  agent_id: string;
  started_at: string;
  duration_seconds: number;
  recorded: boolean;
  status: CallStatus;
  messages?: { role: 'user' | 'assistant'; content: string }[];
}

interface CallHistoryValue {
  calls: CallRecord[];
  /** True until the first load finishes. */
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Shows a just-finished call straight away, before the next refresh. */
  addCall: (record: CallRecord) => void;
  clearHistory: () => Promise<void>;
  removeCall: (id: string) => Promise<void>;
  getCall: (id: string | undefined) => CallRecord | undefined;
  /** Fetches a call with its transcript. */
  loadCall: (id: string) => Promise<CallRecord>;
}

const CallHistoryContext = createContext<CallHistoryValue | null>(null);

function toRecord(c: ApiCall): CallRecord {
  return {
    id: c.id,
    agentId: c.agent_id,
    startedAt: c.started_at,
    durationSeconds: c.duration_seconds,
    status: c.status,
    recorded: c.recorded,
    transcript: (c.messages ?? []).map((m): TranscriptLine => ({
      speaker: m.role === 'user' ? 'user' : 'agent',
      text: m.content,
    })),
  };
}

/** Call history from the Nimo API. */
export function CallHistoryProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await api<ApiCall[]>('/calls');
      setCalls((prev) => {
        const fresh = list.map(toRecord);
        // Keep transcripts already loaded for calls we have.
        return fresh.map((c) => ({ ...c, transcript: prev.find((p) => p.id === c.id)?.transcript ?? [] }));
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t load your calls.');
    } finally {
      setLoading(false);
    }
  }, []);

  // A different user (or signed out): drop the old user's calls straight away.
  const [loadedFor, setLoadedFor] = useState(userId);
  if (loadedFor !== userId) {
    setLoadedFor(userId);
    setCalls([]);
    setLoading(true);
  }

  useEffect(() => {
    if (userId) void Promise.resolve().then(refresh);
  }, [userId, refresh]);

  const addCall = useCallback((record: CallRecord) => {
    setCalls((prev) => [record, ...prev.filter((c) => c.id !== record.id)]);
  }, []);

  const removeCall = useCallback(async (id: string) => {
    await api(`/calls/${id}`, { method: 'DELETE' });
    setCalls((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    const ids = calls.map((c) => c.id);
    await Promise.all(ids.map((id) => api(`/calls/${id}`, { method: 'DELETE' })));
    setCalls([]);
  }, [calls]);

  const getCall = useCallback((id: string | undefined) => calls.find((c) => c.id === id), [calls]);

  const loadCall = useCallback(async (id: string) => {
    const record = toRecord(await api<ApiCall>(`/calls/${id}`));
    setCalls((prev) =>
      prev.some((c) => c.id === id) ? prev.map((c) => (c.id === id ? record : c)) : [...prev, record],
    );
    return record;
  }, []);

  const value = useMemo(
    () => ({ calls, loading, error, refresh, addCall, clearHistory, removeCall, getCall, loadCall }),
    [calls, loading, error, refresh, addCall, clearHistory, removeCall, getCall, loadCall],
  );
  return <CallHistoryContext.Provider value={value}>{children}</CallHistoryContext.Provider>;
}

export function useCallHistory(): CallHistoryValue {
  const ctx = useContext(CallHistoryContext);
  if (!ctx) throw new Error('useCallHistory must be used inside CallHistoryProvider');
  return ctx;
}
