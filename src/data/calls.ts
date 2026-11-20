export type CallStatus = 'completed' | 'missed' | 'cancelled';

export interface TranscriptLine {
  speaker: 'user' | 'agent';
  text: string;
}

export interface CallRecord {
  id: string;
  agentId: string;
  /** ISO timestamp of when the call started. */
  startedAt: string;
  durationSeconds: number;
  status: CallStatus;
  /** Whether audio was recorded (paid-plan feature). */
  recorded: boolean;
  /** Loaded with the call's details; empty in the list. */
  transcript: TranscriptLine[];
}

export const callStatusLabel: Record<CallStatus, string> = {
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
};
