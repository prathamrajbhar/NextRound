import { describe, it, expect } from 'vitest';
import { formatSeconds } from '@/components/interview/console/format';

describe('interview/console/format', () => {
  it('formats zero as 00:00', () => {
    expect(formatSeconds(0)).toBe('00:00');
  });

  it('pads seconds below 10', () => {
    expect(formatSeconds(9)).toBe('00:09');
  });

  it('formats plain minutes', () => {
    expect(formatSeconds(60)).toBe('01:00');
    expect(formatSeconds(120)).toBe('02:00');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatSeconds(61)).toBe('01:01');
    expect(formatSeconds(599)).toBe('09:59');
    expect(formatSeconds(900)).toBe('15:00');
  });

  it('formats arbitrary durations without wrapping', () => {
    expect(formatSeconds(3599)).toBe('59:59');
    expect(formatSeconds(3600)).toBe('60:00');
    expect(formatSeconds(3661)).toBe('61:01');
  });

  it('handles fractional input by flooring', () => {
    expect(formatSeconds(90.9)).toBe('01:30');
  });

  it('clamps negative input to zero', () => {
    expect(formatSeconds(-5)).toBe('00:00');
  });
});