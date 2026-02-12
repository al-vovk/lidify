# Debugging Audio Playback

## State Machine Debug Mode

The playback state machine has built-in debugging tools. Enable verbose logging:

```js
// In browser console
localStorage.setItem('lidifyAudioDebug', '1');
// Reload the page — all state transitions will be logged to console
```

Disable:

```js
localStorage.removeItem('lidifyAudioDebug');
```

## Transition History

The state machine keeps a ring buffer of the last 20 transitions (always recording, even without debug mode). To inspect:

```js
// In browser console
playbackStateMachine.dumpHistory()
```

Output example:

```
[
  "IDLE→LOADING [ok] 14:32:05.123",
  "LOADING→READY [ok] 14:32:05.891",
  "READY→PLAYING [ok] 14:32:06.002",
  "PLAYING→LOADING [ok] 14:32:12.456",
  "LOADING→PLAYING [ok] 14:32:12.890"
]
```

- `[ok]` — transition succeeded
- `[REJECTED]` — transition was invalid (indicates a bug in the transition map). These also emit a `console.warn` automatically.

## State Machine States

```
IDLE → LOADING → READY → PLAYING → PAUSED (via READY)
                    ↕        ↕
                 SEEKING  BUFFERING
                    ↕        ↕
                  ERROR ← (any non-IDLE state)
```

| State | Meaning |
|-------|---------|
| IDLE | No media loaded |
| LOADING | Track source being fetched |
| READY | Audio loaded, not playing |
| PLAYING | Audio actively playing |
| SEEKING | User scrubbing the timeline |
| BUFFERING | Playback stalled waiting for data |
| ERROR | Playback failed |

Universal transitions: every state can reach LOADING (new track) and IDLE (stop). Every non-IDLE state can reach ERROR.

## Background Suspension Debugging

Some platforms (notably mobile) suspend PWA JavaScript when the app goes to background. Recovery mechanisms:

1. **Visibility change recovery** — when the app returns from background, `AudioElement` checks for stuck states (loading ref stuck, state machine in LOADING/BUFFERING too long) and force-syncs from the audio engine.
2. **15s loading timeout** — if a load never completes, transitions to ERROR.
3. **Heartbeat monitor** — 1Hz check that audio is actually playing when `isPlaying` is true.

To debug mobile PWA issues:
1. Connect device to desktop (Safari Web Inspector for iOS, chrome://inspect for Android)
2. Open the remote inspector for the PWA page
3. Enable debug mode: `localStorage.setItem('lidifyAudioDebug', '1')`
4. Reproduce the issue
5. Check `playbackStateMachine.dumpHistory()` for the transition sequence leading to the stuck state

## Audio Engine Inspection

The audio engine singleton is also accessible in console:

```js
// Check current audio element state
audioEngine.isPlaying()    // true/false
audioEngine.getCurrentTime() // seconds
audioEngine.getDuration()    // seconds
```

## Common Issues

| Symptom | Likely Cause | Debug Steps |
|---------|-------------|-------------|
| Stuck spinner | State machine stuck in LOADING/BUFFERING | Check `dumpHistory()` for missing transition |
| Play button unresponsive | `isPlaying` out of sync with engine | Compare `audioEngine.isPlaying()` with UI state |
| No sound but "playing" | Audio element paused by OS | Check remote inspector for media errors |
| Lock screen controls gone | OS suspended JS | Expected after background suspension — controls return on next play |
