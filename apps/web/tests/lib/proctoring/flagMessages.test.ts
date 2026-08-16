import { describe, it, expect } from 'vitest';
import { PROCTORING_FLAG_MESSAGES, getProctoringFlagMessage } from '@/lib/proctoring/flagMessages';

describe('proctoring/flagMessages', () => {
  it('provides a human message for every known proctoring flag kind', () => {
    const kinds = Object.keys(PROCTORING_FLAG_MESSAGES);
    expect(kinds.length).toBeGreaterThan(0);

    for (const kind of kinds) {
      const msg = getProctoringFlagMessage(kind);
      expect(msg).not.toBeNull();
      expect(msg!.title.length).toBeGreaterThan(0);
      expect(msg!.description.length).toBeGreaterThan(0);
      expect(['info', 'error']).toContain(msg!.variant);
    }
  });

  it('covers every violation kind the proctoring client can emit', () => {
    const expectedKinds = [
      'tab_hidden',
      'fullscreen_exit',
      'window_blur',
      'network_disconnected',
      'multiple_faces_detected',
      'multiple_faces_persistent',
      'no_face_detected',
      'audio_stopped',
      'video_stopped',
      'audio_muted',
      'video_muted',
      'paste_activity',
      'multiple_voices_detected',
    ];

    for (const kind of expectedKinds) {
      expect(getProctoringFlagMessage(kind), `missing message for "${kind}"`).not.toBeNull();
    }
  });

  it('returns null for unknown kinds so callers can degrade gracefully', () => {
    expect(getProctoringFlagMessage('not_a_real_flag')).toBeNull();
    expect(getProctoringFlagMessage('')).toBeNull();
  });

  it('treats integrity-critical flags as error variant', () => {
    const errorFlags = ['tab_hidden', 'fullscreen_exit', 'window_blur', 'network_disconnected', 'multiple_faces_persistent', 'no_face_detected', 'paste_activity'];
    for (const kind of errorFlags) {
      expect(getProctoringFlagMessage(kind)!.variant).toBe('error');
    }
  });

  it('uses info variant for environmental warnings', () => {
    expect(getProctoringFlagMessage('background_noise_high')!.variant).toBe('info');
    expect(getProctoringFlagMessage('sudden_noise_spike')!.variant).toBe('info');
  });
});