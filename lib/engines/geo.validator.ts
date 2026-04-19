// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Geo Validator (L1 Assertion Layer)
// Pure functions. Zero side effects. 100% testable.
//
// Enforces:
//   BR-03: The 2-Mile Rule
//
// Implementation: Haversine formula (~0.3% accuracy for short distances)
// Zero external API dependencies.
// ═══════════════════════════════════════════════════════════════════

import type { Coordinates, GeoVerdict } from '@/types';

// ─── Constants ──────────────────────────────────────────────────

/** Midpoint of the Las Vegas Strip (near Bellagio Fountains) */
export const STRIP_CENTER: Coordinates = {
  lat: 36.1147,
  lng: -115.1728,
};

/** Maximum pickup radius in miles */
export const MAX_RADIUS_MILES = 2.0;

/** Earth's mean radius in miles */
const EARTH_RADIUS_MILES = 3958.8;

// ─── BR-03: The 2-Mile Rule ────────────────────────────────────

/**
 * Validates that a pickup location is within the 2-mile service radius
 * of the Las Vegas Strip center.
 *
 * @param pickup - Coordinates of the proposed pickup location
 * @returns GeoVerdict with within-radius status and exact distance
 */
export function validatePickup(pickup: Coordinates): GeoVerdict {
  const distanceMiles = haversineDistance(STRIP_CENTER, pickup);

  return {
    withinRadius: distanceMiles <= MAX_RADIUS_MILES,
    distanceMiles: Math.round(distanceMiles * 100) / 100, // 2 decimal places
    maxRadiusMiles: MAX_RADIUS_MILES,
  };
}

// ─── Haversine Formula ─────────────────────────────────────────

/**
 * Calculates the great-circle distance between two coordinate pairs
 * using the Haversine formula.
 *
 * @param a - First coordinate (lat/lng)
 * @param b - Second coordinate (lat/lng)
 * @returns Distance in miles
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const aLat = toRad(a.lat);
  const bLat = toRad(b.lat);

  const haversineFactor =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(aLat) * Math.cos(bLat) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const centralAngle = 2 * Math.atan2(
    Math.sqrt(haversineFactor),
    Math.sqrt(1 - haversineFactor)
  );

  return EARTH_RADIUS_MILES * centralAngle;
}
