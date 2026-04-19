// ═══════════════════════════════════════════════════════════════════
// Unit Tests — Capacity Engine (L1)
// Tests for BR-01 (14-Cap) and BR-05 (Min Age)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  validateBooking,
  validateMinAge,
  getRemainingCapacity,
} from '@/lib/engines/capacity.engine';
import type { TourSlot } from '@/types';

// ─── Test Fixtures ──────────────────────────────────────────────

function makeSlot(overrides: Partial<TourSlot> = {}): TourSlot {
  return {
    id: 'test-slot',
    templateId: 'tmpl-test',
    date: '2026-05-01T10:00:00.000Z',
    guideId: 'guide-01',
    vehicleId: 'veh-01',
    maxCapacity: 14,
    currentCapacity: 0,
    status: 'SCHEDULED',
    ...overrides,
  };
}

// ─── BR-01: The 14-Cap Rule ────────────────────────────────────

describe('CapacityEngine.validateBooking (BR-01: 14-Cap)', () => {
  it('allows booking when slot has capacity', () => {
    const slot = makeSlot({ currentCapacity: 0 });
    const result = validateBooking(slot, 4);

    expect(result.allowed).toBe(true);
    expect(result.remainingCapacity).toBe(10); // 14 - 0 - 4
    expect(result.requestedCount).toBe(4);
  });

  it('allows exact capacity fill (13/14 + 1)', () => {
    const slot = makeSlot({ currentCapacity: 13 });
    const result = validateBooking(slot, 1);

    expect(result.allowed).toBe(true);
    expect(result.remainingCapacity).toBe(0);
  });

  it('rejects when slot is at max capacity (14/14)', () => {
    const slot = makeSlot({ currentCapacity: 14 });
    const result = validateBooking(slot, 1);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Exceeds capacity');
    expect(result.remainingCapacity).toBe(0);
  });

  it('rejects overshoot by 1 (13/14 + 2)', () => {
    const slot = makeSlot({ currentCapacity: 13 });
    const result = validateBooking(slot, 2);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Exceeds capacity');
    expect(result.remainingCapacity).toBe(1);
    expect(result.requestedCount).toBe(2);
  });

  it('rejects when slot status is MAINTENANCE', () => {
    const slot = makeSlot({ status: 'MAINTENANCE', currentCapacity: 0 });
    const result = validateBooking(slot, 2);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not accepting bookings');
    expect(result.reason).toContain('MAINTENANCE');
  });

  it('rejects when slot status is COMPLETED', () => {
    const slot = makeSlot({ status: 'COMPLETED' });
    const result = validateBooking(slot, 1);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not accepting bookings');
  });

  it('rejects zero passengers', () => {
    const slot = makeSlot();
    const result = validateBooking(slot, 0);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Invalid passenger count');
  });

  it('rejects negative passengers', () => {
    const slot = makeSlot();
    const result = validateBooking(slot, -1);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Invalid passenger count');
  });
});

// ─── BR-05: Min Age Validation ─────────────────────────────────

describe('CapacityEngine.validateMinAge (BR-05: Min Age)', () => {
  it('allows when all passengers meet min age', () => {
    const result = validateMinAge(5, [8, 12, 25]);
    expect(result.allowed).toBe(true);
  });

  it('allows when no ages provided (optional check)', () => {
    const result = validateMinAge(5);
    expect(result.allowed).toBe(true);
  });

  it('allows with empty ages array', () => {
    const result = validateMinAge(5, []);
    expect(result.allowed).toBe(true);
  });

  it('rejects when one passenger is underage', () => {
    const result = validateMinAge(5, [8, 3, 25]);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('under minimum age');
    expect(result.reason).toContain('5');
    expect(result.reason).toContain('3');
  });

  it('rejects multiple underage passengers', () => {
    const result = validateMinAge(12, [8, 5, 25, 10]);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('3 passenger(s)');
  });

  it('allows when passenger is exactly min age', () => {
    const result = validateMinAge(5, [5]);
    expect(result.allowed).toBe(true);
  });
});

// ─── Utility: getRemainingCapacity ─────────────────────────────

describe('CapacityEngine.getRemainingCapacity', () => {
  it('calculates remaining capacity correctly', () => {
    const slot = makeSlot({ currentCapacity: 10 });
    expect(getRemainingCapacity(slot, 3)).toBe(1); // 14 - 10 - 3
  });

  it('returns negative for overshoot', () => {
    const slot = makeSlot({ currentCapacity: 13 });
    expect(getRemainingCapacity(slot, 3)).toBe(-2); // 14 - 13 - 3
  });

  it('returns zero for exact fill', () => {
    const slot = makeSlot({ currentCapacity: 10 });
    expect(getRemainingCapacity(slot, 4)).toBe(0); // 14 - 10 - 4
  });
});
