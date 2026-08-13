import { describe, expect, it } from 'vitest';
import { getPolicy, evaluateSessionPolicy } from '../src/services/proctoring-policy.service';
import { CreateProctoringSessionSchema, BatchEventsSchema, ReviewViolationSchema } from '../src/validators/proctoring.schemas';


const VALID_UUID_1 = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UUID_2 = '123e4567-e89b-12d3-a456-426614174001';
const VALID_UUID_3 = '123e4567-e89b-12d3-a456-426614174002';
const VALID_UUID_4 = '123e4567-e89b-12d3-a456-426614174003';

describe('Proctoring Policy Engine', () => {
  const policy = getPolicy('assessment-v1');

  it('should flag visibility loss (tab hidden) violations when they reach review count threshold', () => {
    const events: any[] = [
      
      { id: '1', kind: 'tab_hidden', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 1000 },
      { id: '2', kind: 'tab_visible', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:05Z'), session_elapsed_ms: 6000 },
      
      { id: '3', kind: 'tab_hidden', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:01:00Z'), session_elapsed_ms: 61000 },
      { id: '4', kind: 'tab_visible', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:01:05Z'), session_elapsed_ms: 66000 },
      
      { id: '5', kind: 'tab_hidden', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:02:00Z'), session_elapsed_ms: 121000 },
      { id: '6', kind: 'tab_visible', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:02:05Z'), session_elapsed_ms: 126000 },
      
      { id: '7', kind: 'tab_hidden', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:03:00Z'), session_elapsed_ms: 181000 },
      { id: '8', kind: 'tab_visible', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:03:05Z'), session_elapsed_ms: 186000 },
    ];

    const { violations } = evaluateSessionPolicy(policy, events);
    const tabViolation = violations.find((v) => v.rule_code === 'repeated_tab_switch');

    expect(tabViolation).toBeDefined();
    expect(tabViolation?.occurrence_count).toBe(4);
    expect(tabViolation?.severity).toBe('medium');
  });

  it('should flag fullscreen exit breach with duration >= 30 seconds as high severity', () => {
    const events: any[] = [
      {
        id: '1',
        kind: 'fullscreen_exit',
        severity: 'warning',
        source: 'browser',
        client_timestamp: new Date('2026-08-10T10:00:00Z'),
        session_elapsed_ms: 1000,
      },
      
      {
        id: '2',
        kind: 'fullscreen_enter',
        severity: 'info',
        source: 'browser',
        client_timestamp: new Date('2026-08-10T10:00:35Z'),
        session_elapsed_ms: 36000,
      },
    ];

    const { violations } = evaluateSessionPolicy(policy, events);
    const fsViolation = violations.find((v) => v.rule_code === 'fullscreen_exit_review');

    expect(fsViolation).toBeDefined();
    expect(fsViolation?.occurrence_count).toBe(1);
    expect(fsViolation?.severity).toBe('high');
  });

  it('should flag fullscreen exit breach with duration >= 5 seconds but < 30 seconds as warning (low severity)', () => {
    const events: any[] = [
      {
        id: '1',
        kind: 'fullscreen_exit',
        severity: 'warning',
        source: 'browser',
        client_timestamp: new Date('2026-08-10T10:00:00Z'),
        session_elapsed_ms: 1000,
      },
      
      {
        id: '2',
        kind: 'fullscreen_enter',
        severity: 'info',
        source: 'browser',
        client_timestamp: new Date('2026-08-10T10:00:08Z'),
        session_elapsed_ms: 9000,
      },
    ];

    const { violations } = evaluateSessionPolicy(policy, events);
    const fsViolation = violations.find((v) => v.rule_code === 'fullscreen_exit_warning');

    expect(fsViolation).toBeDefined();
    expect(fsViolation?.occurrence_count).toBe(1);
    expect(fsViolation?.severity).toBe('low');
  });

  it('should flag stopped media tracks as medium severity when cumulative stopped duration > 10s', () => {
    const events: any[] = [
      {
        id: '1',
        kind: 'video_stopped',
        severity: 'warning',
        source: 'browser',
        client_timestamp: new Date('2026-08-10T10:00:00Z'),
        session_elapsed_ms: 1000,
        payload_json: { label: 'FaceTime HD Camera' },
      },
      
      {
        id: '2',
        kind: 'camera_started',
        severity: 'info',
        source: 'browser',
        client_timestamp: new Date('2026-08-10T10:00:15Z'),
        session_elapsed_ms: 16000,
      },
    ];

    const { violations } = evaluateSessionPolicy(policy, events);
    const mediaViolation = violations.find((v) => v.rule_code === 'media_track_disabled');

    expect(mediaViolation).toBeDefined();
    expect(mediaViolation?.occurrence_count).toBe(1);
    expect(mediaViolation?.severity).toBe('medium');
  });

  it('should flag heartbeat telemetry gaps when gap >= 120s', () => {
    const events: any[] = [
      { id: '1', kind: 'heartbeat', severity: 'info', source: 'system', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 0 },
      
      { id: '2', kind: 'heartbeat', severity: 'info', source: 'system', client_timestamp: new Date('2026-08-10T10:02:05Z'), session_elapsed_ms: 125000 },
    ];

    const { violations } = evaluateSessionPolicy(policy, events);
    const gapViolation = violations.find((v) => v.rule_code === 'heartbeat_gap');

    expect(gapViolation).toBeDefined();
    expect(gapViolation?.severity).toBe('high');
  });

  it('should flag face_count_changed (0 face) when cumulative missing duration >= 10s', () => {
    const events: any[] = [
      { id: '1', kind: 'face_count_changed', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 0, payload_json: { newFaceCount: 0 } },
      { id: '2', kind: 'face_count_changed', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:12Z'), session_elapsed_ms: 12000, payload_json: { newFaceCount: 1 } },
    ];
    const { violations } = evaluateSessionPolicy(policy, events);
    const faceViolation = violations.find((v) => v.rule_code === 'no_face_detected');
    expect(faceViolation).toBeDefined();
    expect(faceViolation?.severity).toBe('medium');
  });

  it('should flag multiple faces when cumulative duration >= 5s', () => {
    const events: any[] = [
      { id: '1', kind: 'face_count_changed', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 0, payload_json: { newFaceCount: 2 } },
      { id: '2', kind: 'face_count_changed', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:06Z'), session_elapsed_ms: 6000, payload_json: { newFaceCount: 1 } },
    ];
    const { violations } = evaluateSessionPolicy(policy, events);
    const faceViolation = violations.find((v) => v.rule_code === 'multiple_faces_detected');
    expect(faceViolation).toBeDefined();
    expect(faceViolation?.severity).toBe('high');
  });

  it('should flag multiple voices when occurrence count >= 2', () => {
    const events: any[] = [
      { id: '1', kind: 'multiple_voices_detected', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 0 },
      { id: '2', kind: 'multiple_voices_detected', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:05Z'), session_elapsed_ms: 5000 },
    ];
    const { violations } = evaluateSessionPolicy(policy, events);
    const voiceViolation = violations.find((v) => v.rule_code === 'multiple_voices_detected');
    expect(voiceViolation).toBeDefined();
    expect(voiceViolation?.severity).toBe('medium');
  });

  it('should flag copy/paste abuse when occurrence count >= 5', () => {
    const events: any[] = [
      { id: '1', kind: 'copy_activity', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 0 },
      { id: '2', kind: 'paste_activity', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:05Z'), session_elapsed_ms: 5000 },
      { id: '3', kind: 'copy_activity', severity: 'info', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:10Z'), session_elapsed_ms: 10000 },
      { id: '4', kind: 'paste_activity', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:15Z'), session_elapsed_ms: 15000 },
      { id: '5', kind: 'paste_activity', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:20Z'), session_elapsed_ms: 20000 },
    ];
    const { violations } = evaluateSessionPolicy(policy, events);
    const cpViolation = violations.find((v) => v.rule_code === 'copy_paste_abuse');
    expect(cpViolation).toBeDefined();
    expect(cpViolation?.severity).toBe('low');
  });

  it('should flag suspicious behavior pattern when multiple warnings occur in a 30s sliding window', () => {
    const events: any[] = [
      { id: '1', kind: 'tab_hidden', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:00Z'), session_elapsed_ms: 0 },
      { id: '2', kind: 'fullscreen_exit', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:10Z'), session_elapsed_ms: 10000 },
      { id: '3', kind: 'no_face_detected', severity: 'warning', source: 'browser', client_timestamp: new Date('2026-08-10T10:00:25Z'), session_elapsed_ms: 25000 },
    ];
    const { violations } = evaluateSessionPolicy(policy, events);
    const patternViolation = violations.find((v) => v.rule_code === 'suspicious_behavior_pattern');
    expect(patternViolation).toBeDefined();
    expect(patternViolation?.severity).toBe('high');
  });
});

describe('Proctoring Zod Schemas', () => {
  it('should validate valid proctoring session creation payloads', () => {
    const payload = {
      id: VALID_UUID_1,
      candidate_id: VALID_UUID_2,
      session_type: 'coding',
      assessment_id: VALID_UUID_3,
      policy_version: 'assessment-v1',
      consent_version: 'v1',
    };

    const parsed = CreateProctoringSessionSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid session type', () => {
    const payload = {
      id: VALID_UUID_1,
      candidate_id: VALID_UUID_2,
      session_type: 'invalid-type',
      policy_version: 'assessment-v1',
      consent_version: 'v1',
    };

    const parsed = CreateProctoringSessionSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('should validate valid event batch payloads', () => {
    const payload = {
      events: [
        {
          client_event_id: VALID_UUID_4,
          client_sequence: 1,
          kind: 'tab_hidden',
          severity: 'warning',
          source: 'browser',
          client_timestamp: new Date().toISOString(),
          session_elapsed_ms: 500,
        },
      ],
    };

    const parsed = BatchEventsSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('should reject event batch missing client_event_id', () => {
    const payload = {
      events: [
        {
          client_sequence: 1,
          kind: 'tab_hidden',
          severity: 'warning',
          source: 'browser',
          client_timestamp: new Date().toISOString(),
          session_elapsed_ms: 500,
        },
      ],
    };

    const parsed = BatchEventsSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});

describe('HR Review Validator Schema', () => {
  it('should validate valid HR review payloads', () => {
    const payload = {
      status: 'resolved',
      review_reason: 'Legitimate network drop, verified with candidate.',
    };
    const parsed = ReviewViolationSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const payload = {
      status: 'invalid-status',
      review_reason: 'Reason is here',
    };
    const parsed = ReviewViolationSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
