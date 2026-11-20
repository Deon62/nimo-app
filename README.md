# Nimo

A design prototype of Nimo, an AI voice calling app built with Expo (SDK 58), Expo Router and TypeScript.
Every call is **simulated**: a scripted state machine stands in for the future FastAPI and OpenAI Realtime backend. The microphone is never used.

## Run

```bash
npm install
npx expo start          # press i / a / w for iOS, Android or web
npm run typecheck
npx expo lint
```

## Structure

```
src/
  app/          Expo Router routes (thin files that re-export screens)
    (tabs)/     Home, Explore, Calls, Profile (custom GlassTabBar)
    agent/[id]  Agent detail (modal)
    story/[id]  Status-style agent stories
    call        Active call (full-screen modal)
    call-history/[id], settings/[section]
  screens/      Screen implementations
  components/   Reusable UI (GlassTabBar, AgentCard, VoiceVisualizer, CallControls, ...)
  data/         Mock agents, calls, user and settings
  hooks/        useMockCall (demo call engine), layout and loading helpers
  state/        Context providers: active call, call history, preferences
  theme/        Colour, typography and spacing tokens
```

## Connecting the real backend

- **`src/hooks/useMockCall.ts`** is the only place that fakes a conversation. Keep its return shape
  (`phase`, `caption`, `transcript`, `muted`, `speaker`, `start/end/toggle*`) and drive it from Realtime API events.
- **`VoiceVisualizer`** animates from the call phase. To make it react to audio, feed real input and output levels into the bar shared values.
- **Voice previews** (`state/VoicePreviewContext.tsx`) use on-device text-to-speech with a per-agent pitch, rate and intro line. Swap in recorded voice clips from the backend when they exist.
- **`CallHistoryContext`**, **`PreferencesContext`** and the `data/` files are the seams for API-backed persistence.

## Notes

- On Android the glass tab bar uses a frosted translucent fill rather than live blur, because live blur on Android needs a `BlurTargetView` wrapping the content.
- The greeting follows the time of day.
