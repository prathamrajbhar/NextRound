import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/cn';

describe('apps/web/src/lib/cn.ts utility', () => {
  it('combines simple class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles conditional class names safely', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active');
  });

  it('resolves conflicting Tailwind CSS utility classes in favor of later ones', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles null, undefined, and empty string inputs cleanly', () => {
    expect(cn('btn', null, undefined, '', 'mt-2')).toBe('btn mt-2');
  });
});
