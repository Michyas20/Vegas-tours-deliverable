// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Capacity Engine (L1 Assertion Layer)
// Pure functions. Zero side effects. 100% testable.
//
// Enforces:
//   BR-01: The 14-Cap Rule
//   BR-05: Min Age Validation
// ═══════════════════════════════════════════════════════════════════

import type { TourSlot, CapacityVerdict } from '@/types';

// ─── BR-01: The 14-Cap Rule ────────────────────────────────────

/**
 * Validates whether a booking request can fit within a slot's
 * remaining capacity without violating the 14-Cap invariant.
 *
 * Rules (evaluated in order):
 * 1. Slot must be in SCHEDULED status
 * 2. Passenger count must be > 0
 * 3. currentCapacity + passengerCount must not exceed maxCapacity
 *
 * @param slot           - The TourSlot to validate against
 * @param passengerCount - Number of passengers in the booking request
 * @returns CapacityVerdict with allowed/denied status and reason
 */
export function validateBooking(
  slot: TourSlot,
  passengerCount: number
): CapacityVerdict {
  const remaining = slot.maxCapacity - slot.currentCapacity;

  // Rule 1: Slot must be accepting bookings
  if (slot.status !== 'SCHEDULED') {
    return {
      allowed: false,
      reason: `Slot is not accepting bookings (status: ${slot.status})`,
      remainingCapacity: remaining,
      requestedCount: passengerCount,
    };
  }

  // Rule 2: Passenger count must be positive
  if (passengerCount <= 0) {
    return {
      allowed: false,
      reason: 'Invalid passenger count: must be greater than 0',
      remainingCapacity: remaining,
      requestedCount: passengerCount,
    };
  }

  // Rule 3: 14-Cap enforcement
  if (slot.currentCapacity + passengerCount > slot.maxCapacity) {
    return {
      allowed: false,
      reason: `Exceeds capacity: ${passengerCount} requested, ${remaining} remaining (max: ${slot.maxCapacity})`,
      remainingCapacity: remaining,
      requestedCount: passengerCount,
    };
  }

  // All checks passed
  return {
    allowed: true,
    remainingCapacity: remaining - passengerCount,
    requestedCount: passengerCount,
  };
}

// ─── BR-05: Min Age Validation ─────────────────────────────────

/**
 * Validates that all passengers meet the tour's minimum age requirement.
 *
 * @param minAge        - The minimum age from the TourTemplate (default: 5)
 * @param passengerAges - Optional array of passenger ages to validate
 * @returns Verdict with allowed status and reason if denied
 */
export function validateMinAge(
  minAge: number,
  passengerAges?: number[]
): { allowed: boolean; reason?: string } {
  // If no ages provided, assume all passengers meet the requirement
  // (age check is optional — some bookings may not collect ages)
  if (!passengerAges || passengerAges.length === 0) {
    return { allowed: true };
  }

  const underagePassengers = passengerAges.filter((age) => age < minAge);

  if (underagePassengers.length > 0) {
    return {
      allowed: false,
      reason: `${underagePassengers.length} passenger(s) under minimum age of ${minAge} (ages: ${underagePassengers.join(', ')})`,
    };
  }

  return { allowed: true };
}

// ─── Utility ───────────────────────────────────────────────────

/**
 * Computes the remaining capacity after a hypothetical booking.
 * Does NOT validate — purely computes the delta.
 *
 * @param slot                 - The TourSlot to compute against
 * @param additionalPassengers - Number of passengers to add
 * @returns Remaining seats (can be negative if overshoot)
 */
export function getRemainingCapacity(
  slot: TourSlot,
  additionalPassengers: number
): number {
  return slot.maxCapacity - slot.currentCapacity - additionalPassengers;
}
