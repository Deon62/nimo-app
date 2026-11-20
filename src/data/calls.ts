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
  transcript: TranscriptLine[];
}

function daysAgoAt(days: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const seedCalls: CallRecord[] = [
  {
    id: 'call-1',
    agentId: 'alex',
    startedAt: daysAgoAt(0, 9, 42),
    durationSeconds: 272,
    status: 'completed',
    recorded: true,
    transcript: [
      { speaker: 'user', text: 'Can you help me plan my week?' },
      {
        speaker: 'agent',
        text: 'Absolutely. What are the three most important things you want to accomplish this week?',
      },
    ],
  },
  {
    id: 'call-2',
    agentId: 'maya',
    startedAt: daysAgoAt(1, 18, 15),
    durationSeconds: 728,
    status: 'completed',
    recorded: false,
    transcript: [
      { speaker: 'user', text: 'I’m not sure how to price my new subscription product.' },
      {
        speaker: 'agent',
        text: 'Let’s start with value, not cost. Who is your ideal customer, and what does solving this problem save them each month?',
      },
    ],
  },
  {
    id: 'call-3',
    agentId: 'marcus',
    startedAt: daysAgoAt(2, 14, 30),
    durationSeconds: 525,
    status: 'completed',
    recorded: true,
    transcript: [
      { speaker: 'user', text: 'I have a job interview in English next week.' },
      {
        speaker: 'agent',
        text: 'Brilliant, let’s rehearse. I’ll be the interviewer. Could you tell me a little about yourself?',
      },
    ],
  },
  {
    id: 'call-4',
    agentId: 'nora',
    startedAt: daysAgoAt(3, 11, 20),
    durationSeconds: 372,
    status: 'completed',
    recorded: false,
    transcript: [
      { speaker: 'user', text: 'Can you explain photosynthesis simply?' },
      {
        speaker: 'agent',
        text: 'Of course. Plants take in light, water and carbon dioxide, and turn them into sugar for energy.',
      },
    ],
  },
  {
    id: 'call-5',
    agentId: 'ethan',
    startedAt: daysAgoAt(4, 19, 5),
    durationSeconds: 0,
    status: 'cancelled',
    recorded: false,
    transcript: [],
  },
];

export const callStatusLabel: Record<CallStatus, string> = {
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
};
