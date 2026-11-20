/** Conversation starters shown on Home to help new users make a first call. */
export interface Idea {
  id: string;
  agentId: string;
  prompt: string;
}

export const ideas: Idea[] = [
  { id: 'date', agentId: 'maya', prompt: 'Plan a first date' },
  { id: 'price', agentId: 'marcus', prompt: 'Price my side hustle' },
  { id: 'watch', agentId: 'ethan', prompt: 'What to watch tonight' },
  { id: 'life', agentId: 'grace', prompt: 'What makes a good life?' },
];
