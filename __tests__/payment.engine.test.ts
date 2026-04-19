// ═══════════════════════════════════════════════════════════════════
// Unit Tests — Payment Engine (L1)
// Tests for BR-02 (20% Threshold) and refund calculations
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { calculatePayment, calculateRefund } from '@/lib/engines/payment.engine';
import type { Booking } from '@/types';

// ─── Test Fixtures ──────────────────────────────────────────────

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'bk-test',
    slotId: 'slot-test',
    customerId: 'usr-test',
    passengerCount: 2,
    totalAmount: 400,
    amountPaid: 0,
    paymentStatus: 'PENDING',
    pickupLocation: {
      hotelName: 'Test Hotel',
      address: '123 Test St',
    },
    createdAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}

// ─── BR-02: The 20% Threshold Rule ────────────────────────────

describe('PaymentEngine.calculatePayment (BR-02: 20% Threshold)', () => {
  it('charges 20% deposit when tour is > 10 days away', () => {
    // Booking on Apr 1, Tour on Apr 20 = 19 days away
    const result = calculatePayment(
      150, // $150/person
      4,   // 4 passengers
      '2026-04-01T10:00:00.000Z', // booking date
      '2026-04-20T10:00:00.000Z'  // tour date
    );

    expect(result.totalAmount).toBe(600);              // 150 × 4
    expect(result.depositRequired).toBe(120);           // 600 × 0.20
    expect(result.isFullPaymentRequired).toBe(false);
    expect(result.daysUntilTour).toBe(19);
    expect(result.pricePerPerson).toBe(150);
    expect(result.passengerCount).toBe(4);
  });

  it('charges 100% when tour is exactly 10 days away', () => {
    // Booking on Apr 10, Tour on Apr 20 = 10 days
    const result = calculatePayment(
      150,
      4,
      '2026-04-10T10:00:00.000Z',
      '2026-04-20T10:00:00.000Z'
    );

    expect(result.totalAmount).toBe(600);
    expect(result.depositRequired).toBe(600);           // 100%
    expect(result.isFullPaymentRequired).toBe(true);
    expect(result.daysUntilTour).toBe(10);
  });

  it('charges 100% when tour is < 10 days away', () => {
    // Booking on Apr 15, Tour on Apr 20 = 5 days
    const result = calculatePayment(
      150,
      4,
      '2026-04-15T10:00:00.000Z',
      '2026-04-20T10:00:00.000Z'
    );

    expect(result.totalAmount).toBe(600);
    expect(result.depositRequired).toBe(600);
    expect(result.isFullPaymentRequired).toBe(true);
    expect(result.daysUntilTour).toBe(5);
  });

  it('charges 20% deposit when tour is exactly 11 days away', () => {
    // Boundary test: 11 days = just past threshold
    const result = calculatePayment(
      100,
      2,
      '2026-04-09T10:00:00.000Z',
      '2026-04-20T10:00:00.000Z'
    );

    expect(result.totalAmount).toBe(200);
    expect(result.depositRequired).toBe(40);            // 200 × 0.20
    expect(result.isFullPaymentRequired).toBe(false);
    expect(result.daysUntilTour).toBe(11);
  });

  it('calculates total correctly for single passenger', () => {
    const result = calculatePayment(
      189,
      1,
      '2026-04-01T10:00:00.000Z',
      '2026-04-20T10:00:00.000Z'
    );

    expect(result.totalAmount).toBe(189);
    expect(result.passengerCount).toBe(1);
    expect(result.pricePerPerson).toBe(189);
  });
});

// ─── Refund Calculations ────────────────────────────────────────

describe('PaymentEngine.calculateRefund', () => {
  it('returns full refund for DEPOSIT_PAID bookings', () => {
    const booking = makeBooking({
      paymentStatus: 'DEPOSIT_PAID',
      amountPaid: 80,  // 20% of $400
    });

    const result = calculateRefund(booking);

    expect(result.refundAmount).toBe(80);
    expect(result.refundPercentage).toBe(100);
  });

  it('returns 80% refund for FULLY_PAID bookings', () => {
    const booking = makeBooking({
      paymentStatus: 'FULLY_PAID',
      amountPaid: 400,
    });

    const result = calculateRefund(booking);

    expect(result.refundAmount).toBe(320);  // 400 × 0.80
    expect(result.refundPercentage).toBe(80);
  });

  it('returns zero refund for PENDING bookings', () => {
    const booking = makeBooking({
      paymentStatus: 'PENDING',
      amountPaid: 0,
    });

    const result = calculateRefund(booking);

    expect(result.refundAmount).toBe(0);
    expect(result.refundPercentage).toBe(0);
  });

  it('returns zero refund for CANCELLED bookings', () => {
    const booking = makeBooking({
      paymentStatus: 'CANCELLED',
      amountPaid: 0,
    });

    const result = calculateRefund(booking);

    expect(result.refundAmount).toBe(0);
    expect(result.refundPercentage).toBe(0);
  });
});
