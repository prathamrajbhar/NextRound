import { describe, it, expect } from 'vitest';
import {
  applyViolationPolicy,
  MAX_STRIKES,
  STRIKE_TRIGGER_KINDS,
  IMMEDIATE_DISQUALIFY_KINDS,
} from '@/lib/proctoring/violationPolicy';

describe('proctoring/violationPolicy', () => {
  it('strike-trigger kinds increment a strike and surface a warning', () => {
    for (const kind of STRIKE_TRIGGER_KINDS) {
      const decision = applyViolationPolicy(kind, 0);
      expect(decision.incrementsStrike).toBe(true);
      expect(decision.showWarning).toBe(true);
      expect(decision.disqualifiesImmediately).toBe(false);
      expect(decision.disqualifiesAt).toBe(MAX_STRIKES);
    }
  });

  it('disqualifies on the Nth strike without a separate immediate flag', () => {
    const decision = applyViolationPolicy('tab_hidden', MAX_STRIKES - 1);
    expect(decision.incrementsStrike).toBe(true);
    expect(decision.disqualifiesImmediately).toBe(true);
    expect(decision.showWarning).toBe(true);
  });

  it('does not disqualify below the strike threshold', () => {
    expect(applyViolationPolicy('window_blur', MAX_STRIKES - 2).disqualifiesImmediately).toBe(false);
    expect(applyViolationPolicy('window_blur', 0).disqualifiesImmediately).toBe(false);
  });

  it('treats persistent multi-face as an immediate disqualification with no strike', () => {
    for (const kind of IMMEDIATE_DISQUALIFY_KINDS) {
      const decision = applyViolationPolicy(kind, 0);
      expect(decision.disqualifiesImmediately).toBe(true);
      expect(decision.incrementsStrike).toBe(false);
      expect(decision.showWarning).toBe(false);
    }
  });

  it('is a no-op for non-policy violation kinds (still reported but not scored)', () => {
    const decision = applyViolationPolicy('paste_activity', 0);
    expect(decision.incrementsStrike).toBe(false);
    expect(decision.disqualifiesImmediately).toBe(false);
    expect(decision.showWarning).toBe(false);
    expect(decision.disqualifiesAt).toBeNull();
  });

  it('classifies kinds the same regardless of current strike count', () => {
    expect(applyViolationPolicy('network_disconnected', 0).incrementsStrike).toBe(true);
    expect(applyViolationPolicy('network_disconnected', 10).incrementsStrike).toBe(true);
    expect(applyViolationPolicy('no_face_detected', 10).incrementsStrike).toBe(false);
  });
});