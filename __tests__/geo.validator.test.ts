// ═══════════════════════════════════════════════════════════════════
// Unit Tests — Geo Validator (L1)
// Tests for BR-03 (2-Mile Rule) via Haversine formula
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  validatePickup,
  haversineDistance,
  STRIP_CENTER,
  MAX_RADIUS_MILES,
} from '@/lib/engines/geo.validator';

// ─── Haversine Formula Tests ───────────────────────────────────

describe('GeoValidator.haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const result = haversineDistance(STRIP_CENTER, STRIP_CENTER);
    expect(result).toBe(0);
  });

  it('calculates known distance correctly (approx)', () => {
    // Bellagio to Fremont Street: roughly 3.9 miles
    const bellagio = { lat: 36.1129, lng: -115.1765 };
    const fremont = { lat: 36.1699, lng: -115.1398 };
    const distance = haversineDistance(bellagio, fremont);

    // Should be approximately 4.1 miles — allow ±0.5 for formula variance
    expect(distance).toBeGreaterThan(3.5);
    expect(distance).toBeLessThan(5.0);
  });
});

// ─── BR-03: The 2-Mile Rule ────────────────────────────────────

describe('GeoValidator.validatePickup (BR-03: 2-Mile Rule)', () => {
  it('allows Bellagio (on the Strip, ~0.2mi from center)', () => {
    const result = validatePickup({ lat: 36.1129, lng: -115.1765 });

    expect(result.withinRadius).toBe(true);
    expect(result.distanceMiles).toBeLessThan(1.0);
    expect(result.maxRadiusMiles).toBe(MAX_RADIUS_MILES);
  });

  it('allows MGM Grand (on the Strip, ~1.0mi)', () => {
    const result = validatePickup({ lat: 36.1024, lng: -115.1695 });

    expect(result.withinRadius).toBe(true);
    expect(result.distanceMiles).toBeLessThan(2.0);
  });

  it('allows Caesars Palace (on the Strip, ~0.2mi)', () => {
    const result = validatePickup({ lat: 36.1162, lng: -115.1745 });

    expect(result.withinRadius).toBe(true);
    expect(result.distanceMiles).toBeLessThan(1.0);
  });

  it('allows the Strip center itself (0 distance)', () => {
    const result = validatePickup(STRIP_CENTER);

    expect(result.withinRadius).toBe(true);
    expect(result.distanceMiles).toBe(0);
  });

  it('rejects Henderson (~12.5mi away)', () => {
    const result = validatePickup({ lat: 36.0395, lng: -114.9817 });

    expect(result.withinRadius).toBe(false);
    expect(result.distanceMiles).toBeGreaterThan(10);
  });

  it('rejects North Las Vegas (~8.5mi away)', () => {
    const result = validatePickup({ lat: 36.2333, lng: -115.1353 });

    expect(result.withinRadius).toBe(false);
    expect(result.distanceMiles).toBeGreaterThan(5);
  });

  it('rejects Summerlin (~9mi away)', () => {
    const result = validatePickup({ lat: 36.1604, lng: -115.3280 });

    expect(result.withinRadius).toBe(false);
    expect(result.distanceMiles).toBeGreaterThan(5);
  });

  it('distance values are rounded to 2 decimal places', () => {
    const result = validatePickup({ lat: 36.1129, lng: -115.1765 });

    // Verify rounding: multiply by 100, should be integer-ish
    const rounded = Math.round(result.distanceMiles * 100);
    expect(result.distanceMiles).toBe(rounded / 100);
  });
});
