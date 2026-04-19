// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Payment Engine (L1 Assertion Layer)
// Pure functions. Zero side effects. 100% testable.
//
// Enforces:
//   BR-02: The 20% Threshold Rule
// ═══════════════════════════════════════════════════════════════════

import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Booking, PaymentBreakdown } from '@/types';

// ─── Constants ──────────────────────────────────────────────────

/** Threshold in days: if booking is made > this many days before tour, only deposit required */
const DEPOSIT_THRESHOLD_DAYS = 10;

/** Deposit percentage when booking is > 10 days out */
const DEPOSIT_PERCENTAGE = 0.20;

// ─── BR-02: The 20% Threshold Rule ──────────────────────────────

/**
 * Determines the payment structure based on the gap between
 * booking date and tour date.
 *
 * Rules:
 * - If tourDate - bookingDate > 10 days → 20% deposit required
 * - If tourDate - bookingDate <= 10 days → 100% full payment required
 *
 * @param basePricePerPerson - Per-person price from TourTemplate
 * @param passengerCount     - Number of passengers in this booking
 * @param bookingDateISO     - When the booking is being made (ISO string)
 * @param tourDateISO        - The TourSlot date (ISO string)
 * @returns PaymentBreakdown with deposit/full requirement
 */
export function calculatePayment(
  basePricePerPerson: number,
  passengerCount: number,
  bookingDateISO: string,
  tourDateISO: string
): PaymentBreakdown {
  const totalAmount = basePricePerPerson * passengerCount;

  const bookingDate = parseISO(bookingDateISO);
  const tourDate = parseISO(tourDateISO);

  // Use calendar days for clean day-boundary calculation
  const daysUntilTour = differenceInCalendarDays(tourDate, bookingDate);

  // BR-02: The threshold check
  const isFullPaymentRequired = daysUntilTour <= DEPOSIT_THRESHOLD_DAYS;

  const depositRequired = isFullPaymentRequired
    ? totalAmount                         // 100% charge
    : totalAmount * DEPOSIT_PERCENTAGE;   // 20% deposit

  return {
    totalAmount,
    depositRequired,
    isFullPaymentRequired,
    daysUntilTour,
    pricePerPerson: basePricePerPerson,
    passengerCount,
  };
}

// ─── Refund Calculation ─────────────────────────────────────────

/**
 * Calculates the refund amount for a cancellation.
 *
 * IMPORTANT: This function must only be called AFTER TimeGuard.canCancel()
 * has confirmed that cancellation is allowed (i.e., > 48h from tour).
 *
 * Refund policy:
 * - DEPOSIT_PAID → full deposit refund (100% of amountPaid)
 * - FULLY_PAID   → 80% refund (retain 20% as cancellation fee)
 * - PENDING      → no payment to refund
 *
 * @param booking - The booking being cancelled
 * @returns Refund amount and percentage
 */
export function calculateRefund(booking: Booking): {
  refundAmount: number;
  refundPercentage: number;
} {
  if (booking.amountPaid === 0) {
    return { refundAmount: 0, refundPercentage: 0 };
  }

  switch (booking.paymentStatus) {
    case 'DEPOSIT_PAID':
      // Full refund of the deposit
      return {
        refundAmount: booking.amountPaid,
        refundPercentage: 100,
      };

    case 'FULLY_PAID':
      // 80% refund — retain 20% as cancellation fee
      return {
        refundAmount: booking.amountPaid * 0.80,
        refundPercentage: 80,
      };

    case 'PENDING':
    case 'CANCELLED':
    default:
      return { refundAmount: 0, refundPercentage: 0 };
  }
}
