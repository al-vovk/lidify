/**
 * Playback State Machine
 *
 * Single source of truth for playback state.
 * React state (isPlaying, isBuffering, etc.) derives FROM this.
 */

export type PlaybackState =
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'PLAYING'
  | 'SEEKING'
  | 'BUFFERING'
  | 'ERROR';

export interface StateContext {
  state: PlaybackState;
  previousState: PlaybackState | null;
  error: string | null;
  errorCode: number | null;
  wasPlayingBeforeSeek: boolean;
  lastTransitionTime: number;
}

// Valid state transitions - anything not listed is invalid.
// LOADING and IDLE are reachable from every state (new track / stop).
// ERROR is reachable from every non-IDLE state (failures can happen anywhere).
const VALID_TRANSITIONS: Record<PlaybackState, PlaybackState[]> = {
  IDLE: ['LOADING'],
  LOADING: ['READY', 'PLAYING', 'LOADING', 'ERROR', 'IDLE'],
  READY: ['PLAYING', 'LOADING', 'IDLE', 'SEEKING', 'ERROR'],
  PLAYING: ['PLAYING', 'READY', 'SEEKING', 'BUFFERING', 'LOADING', 'ERROR', 'IDLE'],
  SEEKING: ['PLAYING', 'READY', 'LOADING', 'ERROR', 'IDLE'],
  BUFFERING: ['PLAYING', 'READY', 'LOADING', 'ERROR', 'IDLE'],
  ERROR: ['LOADING', 'IDLE'],
};

export type StateListener = (context: StateContext) => void;

interface TransitionRecord {
  from: PlaybackState;
  to: PlaybackState;
  success: boolean;
  time: number;
}

const HISTORY_SIZE = 20;

export class PlaybackStateMachine {
  private context: StateContext = {
    state: 'IDLE',
    previousState: null,
    error: null,
    errorCode: null,
    wasPlayingBeforeSeek: false,
    lastTransitionTime: Date.now(),
  };

  private listeners = new Set<StateListener>();
  private debugEnabled = false;
  private history: TransitionRecord[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.debugEnabled = localStorage.getItem('lidifyAudioDebug') === '1';
    }
  }

  getState(): PlaybackState {
    return this.context.state;
  }

  getContext(): Readonly<StateContext> {
    return { ...this.context };
  }

  canTransition(to: PlaybackState): boolean {
    return VALID_TRANSITIONS[this.context.state]?.includes(to) ?? false;
  }

  transition(to: PlaybackState, options?: { error?: string; errorCode?: number }): boolean {
    const from = this.context.state;

    if (!this.canTransition(to)) {
      // Always warn — with a complete transition map, this indicates a bug
      console.warn(`[StateMachine] Invalid transition: ${from} → ${to}`);
      this.recordTransition(from, to, false);
      return false;
    }

    // Track if we were playing before seek
    if (to === 'SEEKING') {
      this.context.wasPlayingBeforeSeek = from === 'PLAYING';
    }

    // Clear error when leaving ERROR state
    const error = to === 'ERROR' ? (options?.error ?? 'Unknown error') : null;
    const errorCode = to === 'ERROR' ? (options?.errorCode ?? null) : null;

    this.context = {
      ...this.context,
      previousState: from,
      state: to,
      error,
      errorCode,
      lastTransitionTime: Date.now(),
    };

    this.recordTransition(from, to, true);

    if (this.debugEnabled) {
      console.log(`[StateMachine] ${from} → ${to}`, error ? `(${error})` : '');
    }

    this.notify();
    return true;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getContext());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const ctx = this.getContext();
    for (const fn of this.listeners) {
      try {
        fn(ctx);
      } catch (err) {
        console.error('[StateMachine] Listener error:', err);
      }
    }
  }

  reset(): void {
    this.context = {
      state: 'IDLE',
      previousState: null,
      error: null,
      errorCode: null,
      wasPlayingBeforeSeek: false,
      lastTransitionTime: Date.now(),
    };
    this.notify();
  }

  private recordTransition(from: PlaybackState, to: PlaybackState, success: boolean): void {
    if (this.history.length >= HISTORY_SIZE) {
      this.history.shift();
    }
    this.history.push({ from, to, success, time: Date.now() });
  }

  /** Dump recent transition history as copyable strings. */
  dumpHistory(): string[] {
    return this.history.map(r => {
      const ts = new Date(r.time).toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });
      const status = r.success ? '[ok]' : '[REJECTED]';
      return `${r.from}→${r.to} ${status} ${ts}`;
    });
  }

  // Convenience getters for common checks
  get isIdle(): boolean { return this.context.state === 'IDLE'; }
  get isLoading(): boolean { return this.context.state === 'LOADING'; }
  get isReady(): boolean { return this.context.state === 'READY'; }
  get isPlaying(): boolean { return this.context.state === 'PLAYING'; }
  get isSeeking(): boolean { return this.context.state === 'SEEKING'; }
  get isBuffering(): boolean { return this.context.state === 'BUFFERING'; }
  get hasError(): boolean { return this.context.state === 'ERROR'; }
  get canPlay(): boolean { return this.context.state === 'READY' || this.context.state === 'PLAYING'; }
}

// Singleton instance
export const playbackStateMachine = new PlaybackStateMachine();
