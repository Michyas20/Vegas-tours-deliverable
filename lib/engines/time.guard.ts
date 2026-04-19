// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Time Guard (L1 Assertion Layer)
// Pure functions. Zero side effects. 100% testable.
//
// Enforces:
//   BR-04: The 48h Lock
//
// Design Decision: `nowISO` is an explicit parameter (not Date.now())
// to enable "Time Warp" simulation and 100% deterministic testing.
// ═══════════════════════════════════════════════════════════════════

import { differenceInHours, parseISO, isBefore } from 'date-fns';
import type { CancellationVerdict } from '@/types';

// ─── Constants ──────────────────────────────────────────────────

/** Cancellation lock-out window in hours */
const LOCK_THRESHOLD_HOURS = 48;

// ─── BR-04: The 48h Lock ───────────────────────────────────────

/**
 * Determines whether cancellation/refund is available for a tour.
 *
 * Rule: If the current time is within 48 hours of the tour date,
 * cancellation and refund logic must be disabled.
 *
 * @param tourDateISO - The TourSlot date (ISO string)
 * @param nowISO      - Current time (ISO string) — injectable for testing
 * @returns CancellationVerdict with allowed status and hours remaining
 */
export function canCancel(
  tourDateISO: string,
  nowISO: string
): CancellationVerdict {
  const tourDate = parseISO(tourDateISO);
  const now = parseISO(nowISO);

  const hoursUntilTour = differenceInHours(tourDate, now);

  // If the tour is in the past, cancellation is not allowed
  if (hoursUntilTour < 0) {
    return {
      allowed: false,
      reason: 'Tour date has already passed',
      hoursUntilTour,
      lockThresholdHours: LOCK_THRESHOLD_HOURS,
    };
  }

  // BR-04: The 48h Lock — strictly greater than 48
  if (hoursUntilTour <= LOCK_THRESHOLD_HOURS) {
    return {
      allowed: false,
      reason: `Cancellation locked: tour is within ${LOCK_THRESHOLD_HOURS} hours (${hoursUntilTour}h remaining)`,
      hoursUntilTour,
      lockThresholdHours: LOCK_THRESHOLD_HOURS,
    };
  }

  return {
    allowed: true,
    hoursUntilTour,
    lockThresholdHours: LOCK_THRESHOLD_HOURS,
  };
}

// ─── Booking Window Check ──────────────────────────────────────

/**
 * Checks whether a tour slot is in the future and can accept bookings.
 *
 * @param tourDateISO - The TourSlot date (ISO string)
 * @param nowISO      - Current time (ISO string)
 * @returns true if the tour is in the future, false otherwise
 */
export function isBookable(
  tourDateISO: string,
  nowISO: string
): boolean {
  const tourDate = parseISO(tourDateISO);
  const now = parseISO(nowISO);

  // Tour must be strictly in the future
  return isBefore(now, tourDate);
}
