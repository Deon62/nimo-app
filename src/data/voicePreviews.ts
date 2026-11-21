import type { AudioSource } from 'expo-audio';

import { apiUrl } from '@/lib/api';

/**
 * Voice previews bundled with the app so they play instantly (no server cold start or TTS wait).
 * Downloaded from `GET /agents/{id}/preview`; re-download if an agent's voice or sample text changes.
 */
const bundled: Record<string, number> = {
  alex: require('../../assets/voices/alex.mp3'),
  maya: require('../../assets/voices/maya.mp3'),
  marcus: require('../../assets/voices/marcus.mp3'),
  nora: require('../../assets/voices/nora.mp3'),
  ethan: require('../../assets/voices/ethan.mp3'),
  olivia: require('../../assets/voices/olivia.mp3'),
  daniel: require('../../assets/voices/daniel.mp3'),
  sophia: require('../../assets/voices/sophia.mp3'),
  ryan: require('../../assets/voices/ryan.mp3'),
  grace: require('../../assets/voices/grace.mp3'),
  leo: require('../../assets/voices/leo.mp3'),
  amara: require('../../assets/voices/amara.mp3'),
  james: require('../../assets/voices/james.mp3'),
  zuri: require('../../assets/voices/zuri.mp3'),
  clara: require('../../assets/voices/clara.mp3'),
  hugo: require('../../assets/voices/hugo.mp3'),
  jade: require('../../assets/voices/jade.mp3'),
  omar: require('../../assets/voices/omar.mp3'),
  iris: require('../../assets/voices/iris.mp3'),
  sam: require('../../assets/voices/sam.mp3'),
  felix: require('../../assets/voices/felix.mp3'),
  ben: require('../../assets/voices/ben.mp3'),
  walter: require('../../assets/voices/walter.mp3'),
  river: require('../../assets/voices/river.mp3'),
  charlie: require('../../assets/voices/charlie.mp3'),
};

/** The agent's voice preview: the bundled clip, or the API for agents added since the last bundle. */
export function voicePreviewSource(agentId: string): AudioSource {
  return bundled[agentId] ?? { uri: apiUrl(`/agents/${agentId}/preview`) };
}
