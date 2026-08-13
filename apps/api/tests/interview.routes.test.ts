import { describe, it, expect } from 'vitest';
import {
  ConsentBodySchema,
  EndInterviewBodySchema,
  HrResultBodySchema,
  ProctoringFlagBodySchema,
} from '../src/validators/interview.schemas';
import { computeCompositeScore } from '../src/routes/interviews/interviews.helpers';





describe('ConsentBodySchema', () => {
  it('accepts valid consent with explicit booleans', () => {
    const result = ConsentBodySchema.safeParse({ videoConsent: true, audioConsent: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.videoConsent).toBe(true);
      expect(result.data.audioConsent).toBe(false);
    }
  });

  it('defaults both consents to true when not provided', () => {
    const result = ConsentBodySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.videoConsent).toBe(true);
      expect(result.data.audioConsent).toBe(true);
    }
  });

  it('rejects non-boolean videoConsent', () => {
    const result = ConsentBodySchema.safeParse({ videoConsent: 'yes' });
    expect(result.success).toBe(false);
  });
});

describe('EndInterviewBodySchema', () => {
  it('accepts a valid audio_url', () => {
    const result = EndInterviewBodySchema.safeParse({
      audio_url: 'https://storage.example.com/audio.wav',
    });
    expect(result.success).toBe(true);
  });

  it('coerces an empty audio_url to undefined', () => {
    const result = EndInterviewBodySchema.safeParse({ audio_url: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audio_url).toBeUndefined();
    }
  });

  it('rejects a non-URL audio_url string', () => {
    const result = EndInterviewBodySchema.safeParse({ audio_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts an empty body (both fields optional)', () => {
    const result = EndInterviewBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('ProctoringFlagBodySchema', () => {
  it('accepts a full proctoring payload', () => {
    const result = ProctoringFlagBodySchema.safeParse({
      face_count: 1,
      gaze_centered: true,
      engagement_index: 85,
      multiple_faces_detected: false,
      tab_switch_count: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload (all fields optional)', () => {
    const result = ProctoringFlagBodySchema.safeParse({ face_count: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects an out-of-range engagement_index', () => {
    const result = ProctoringFlagBodySchema.safeParse({ engagement_index: 150 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative tab_switch_count', () => {
    const result = ProctoringFlagBodySchema.safeParse({ tab_switch_count: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-boolean gaze_centered', () => {
    const result = ProctoringFlagBodySchema.safeParse({ gaze_centered: 'yes' });
    expect(result.success).toBe(false);
  });
});

describe('HrResultBodySchema', () => {
  it('accepts a pass decision', () => {
    const result = HrResultBodySchema.safeParse({ decision: 'pass' });
    expect(result.success).toBe(true);
  });

  it('accepts a fail decision with optional notes', () => {
    const result = HrResultBodySchema.safeParse({ decision: 'fail', notes: 'Poor communication' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Poor communication');
    }
  });

  it('rejects an invalid decision value', () => {
    const result = HrResultBodySchema.safeParse({ decision: 'maybe' });
    expect(result.success).toBe(false);
    if (!result.success) {
      
      expect(result.error.flatten().fieldErrors.decision).toBeDefined();
    }
  });

  it('rejects a missing decision', () => {
    const result = HrResultBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});





describe('computeCompositeScore', () => {
  it('returns composite_score directly when present', () => {
    const score = computeCompositeScore({
      composite_score: 0.88,
      confidence: 0.9,
      resume_score: 0.5,
      interview_score: 0.5,
      aptitude_score: 0.5,
      coding_score: 0.5,
    });
    expect(score).toBe(0.88);
  });

  it('computes weighted average when composite_score is null', () => {
    
    
    
    const score = computeCompositeScore({
      composite_score: null,
      confidence: 0.9,
      resume_score: 1.0,
      interview_score: 1.0,
      aptitude_score: 1.0,
      coding_score: 1.0,
    });
    expect(score).toBeCloseTo(1.0, 5);
  });

  it('excludes null stage scores from the weighted average', () => {
    
    
    
    
    
    
    
    const score = computeCompositeScore({
      composite_score: null,
      confidence: null,
      resume_score: 1.0,
      interview_score: null,
      aptitude_score: null,
      coding_score: 1.0,
    });
    
    expect(score).toBeCloseTo(0.5, 5);
  });

  it('returns null when composite_score is null and all stage scores are null', () => {
    
    
    
    const score = computeCompositeScore({
      composite_score: null,
      confidence: null,
      resume_score: null,
      interview_score: null,
      aptitude_score: null,
      coding_score: null,
    });
    
    expect(score).toBe(0);
  });

  it('returns composite_score when it is 0 (not falsy-ignored)', () => {
    const score = computeCompositeScore({
      composite_score: 0,
      confidence: 0,
      resume_score: 1.0,
      interview_score: 1.0,
      aptitude_score: 1.0,
      coding_score: 1.0,
    });
    expect(score).toBe(0);
  });
});
