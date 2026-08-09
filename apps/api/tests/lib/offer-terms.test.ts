import { describe, it, expect } from '@jest/globals';
import { deriveSalary, deriveEquity } from '../../src/lib/offer-terms';

/**
 * Offer terms are derived from the Job record (never hardcoded defaults) so a
 * generated offer always reflects the actual posting. Both helpers return null
 * when a term is genuinely absent so callers refuse to emit a made-up offer.
 */
describe('offer-terms (deriveSalary / deriveEquity)', () => {
  describe('deriveSalary', () => {
    it('parses the top of a "k" salary band', () => {
      expect(deriveSalary('$120k-$150k')).toBe(150000);
    });

    it('parses a decimal lakh (LPA) figure with the lakh multiplier', () => {
      expect(deriveSalary('1.8 LPA')).toBe(180000);
    });

    it('parses a lakh band using the top of band', () => {
      expect(deriveSalary('₹1.3L - ₹1.8L')).toBe(180000);
    });

    it('parses a single lakh figure', () => {
      expect(deriveSalary('₹25L')).toBe(2500000);
    });

    it('parses a fully formatted annual number', () => {
      expect(deriveSalary('$150,000')).toBe(150000);
    });

    it('parses crore figures with the crore multiplier', () => {
      expect(deriveSalary('₹1.2Cr')).toBe(12000000);
    });

    it('returns null when salary is absent or empty', () => {
      expect(deriveSalary(undefined)).toBeNull();
      expect(deriveSalary(null)).toBeNull();
      expect(deriveSalary('')).toBeNull();
      expect(deriveSalary('   ')).toBeNull();
    });

    it('returns null when salary is unparseable (no numeric band)', () => {
      expect(deriveSalary('negotiable')).toBeNull();
      expect(deriveSalary('TBD')).toBeNull();
    });
  });

  describe('deriveEquity', () => {
    it('reads equity from job.thresholds.equity', () => {
      expect(deriveEquity({ thresholds: { equity: '0.25%' } })).toBe('0.25%');
    });

    it('returns null when thresholds are absent', () => {
      expect(deriveEquity({})).toBeNull();
      expect(deriveEquity({ thresholds: undefined })).toBeNull();
    });

    it('returns null when thresholds is not an object', () => {
      expect(deriveEquity({ thresholds: 'not-an-object' })).toBeNull();
    });

    it('returns null when equity is not a non-empty string', () => {
      expect(deriveEquity({ thresholds: { equity: 123 } })).toBeNull();
      expect(deriveEquity({ thresholds: { equity: '' } })).toBeNull();
    });
  });
});
