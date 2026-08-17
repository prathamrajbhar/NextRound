export const STRIKE_TRIGGER_KINDS: readonly string[] = [
  'tab_hidden',
  'fullscreen_exit',
  'window_blur',
  'network_disconnected',
];

export const IMMEDIATE_DISQUALIFY_KINDS: readonly string[] = ['multiple_faces_persistent'];

export const MAX_STRIKES = 3;

export interface ViolationDecision {
  incrementsStrike: boolean;
  disqualifiesImmediately: boolean;
  showWarning: boolean;
  disqualifiesAt: number | null;
}

export function applyViolationPolicy(kind: string, currentStrikes: number): ViolationDecision {
  if (IMMEDIATE_DISQUALIFY_KINDS.includes(kind)) {
    return {
      incrementsStrike: false,
      disqualifiesImmediately: true,
      showWarning: false,
      disqualifiesAt: null,
    };
  }

  if (STRIKE_TRIGGER_KINDS.includes(kind)) {
    const next = currentStrikes + 1;
    return {
      incrementsStrike: true,
      disqualifiesImmediately: next >= MAX_STRIKES,
      showWarning: true,
      disqualifiesAt: MAX_STRIKES,
    };
  }

  return {
    incrementsStrike: false,
    disqualifiesImmediately: false,
    showWarning: false,
    disqualifiesAt: null,
  };
}
