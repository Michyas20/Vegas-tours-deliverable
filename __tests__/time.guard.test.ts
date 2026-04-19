// ═══════════════════════════════════════════════════════════════════
// Unit Tests — Time Guard (L1)
// Tests for BR-04 (48h Lock) and booking window validation
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { canCancel, isBookable } from '@/lib/engines/time.guard';

// ─── Helper: Generate ISO dates relative to a reference ────────

function hoursFromRef(refISO: string, hours: number): string {
  return new Date(new Date(refISO).getTime() + hours * 3600_000).toISOString();
}

const REF_NOW = '2026-04-19T10:00:00.000Z';

// ─── BR-04: The 48h Lock ───────────────────────────────────────

describe('TimeGuard.canCancel (BR-04: 48h Lock)', () => {
  it('allows cancellation when tour is > 48h away', () => {
    const tourDate = hoursFromRef(REF_NOW, 72); // 72h away
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(true);
    expect(result.hoursUntilTour).toBe(72);
    expect(result.lockThresholdHours).toBe(48);
  });

  it('allows cancellation when tour is 49h away (just outside lock)', () => {
    const tourDate = hoursFromRef(REF_NOW, 49);
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(true);
    expect(result.hoursUntilTour).toBe(49);
  });

  it('blocks cancellation at exactly 48h (boundary)', () => {
    const tourDate = hoursFromRef(REF_NOW, 48);
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('locked');
    expect(result.hoursUntilTour).toBe(48);
  });

  it('blocks cancellation when tour is < 48h away', () => {
    const tourDate = hoursFromRef(REF_NOW, 24); // 24h away
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('locked');
    expect(result.hoursUntilTour).toBe(24);
  });

  it('blocks cancellation when tour is 1h away', () => {
    const tourDate = hoursFromRef(REF_NOW, 1);
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(false);
    expect(result.hoursUntilTour).toBe(1);
  });

  it('blocks cancellation when tour date has passed', () => {
    const tourDate = hoursFromRef(REF_NOW, -24); // yesterday
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('already passed');
    expect(result.hoursUntilTour).toBeLessThan(0);
  });

  it('allows cancellation for far-future tour (30 days)', () => {
    const tourDate = hoursFromRef(REF_NOW, 720); // 30 days
    const result = canCancel(tourDate, REF_NOW);

    expect(result.allowed).toBe(true);
    expect(result.hoursUntilTour).toBe(720);
  });
});

// ─── Booking Window Validation ─────────────────────────────────

describe('TimeGuard.isBookable', () => {
  it('returns true for future tours', () => {
    const tourDate = hoursFromRef(REF_NOW, 72);
    expect(isBookable(tourDate, REF_NOW)).toBe(true);
  });

  it('returns false for past tours', () => {
    const tourDate = hoursFromRef(REF_NOW, -24);
    expect(isBookable(tourDate, REF_NOW)).toBe(false);
  });

  it('returns false when tour time equals current time', () => {
    // isBefore(now, tourDate) → false when equal
    expect(isBookable(REF_NOW, REF_NOW)).toBe(false);
  });

  it('returns true for tour 1 minute in the future', () => {
    const tourDate = new Date(new Date(REF_NOW).getTime() + 60_000).toISOString();
    expect(isBookable(tourDate, REF_NOW)).toBe(true);
  });
});
