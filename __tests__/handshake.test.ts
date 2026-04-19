// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — L3→L2 Logic Handshake Test Suite
//
// Verifies that L1 assertion engines are properly wired through the
// L2 store, producing correct verdicts for the L3 UI to surface.
//
// Scenarios:
//  1. GeoValidator — 5-mile pickup rejection
//  2. PaymentEngine — Deposit threshold (20% vs 100%)
//  3. TimeGuard — 48h cancellation lockout
// ═══════════════════════════════════════════════════════════════════

import { describe, test, expect, beforeEach } from 'vitest';
import { useVegasStore, BookingError } from '@/lib/useVegasStore';
import type { GeoVerdict, PaymentBreakdown, CancellationVerdict } from '@/types';

// ─── Time Helpers ────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY_MS).toISOString();

// ─── Coordinates ─────────────────────────────────────────────────

// 5 miles from the Strip center (Henderson direction)
const FIVE_MILES_OUT = { lat: 36.1850, lng: -115.1200 };

// On-Strip (MGM Grand)
const ON_STRIP = { lat: 36.1024, lng: -115.1695 };

describe('L3→L2 LOGIC HANDSHAKE', () => {

  beforeEach(() => {
    useVegasStore.setState(useVegasStore.getInitialState());
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 1: GeoValidator — Pickup Validation (BR-03)
  // 
  // Rule: Pickup must be within 2 miles of the Las Vegas Strip.
  // Input: Coordinates 5 miles from the Strip.
  // Expected: BookingError thrown, GeoVerdict.withinRadius = false
  // ═══════════════════════════════════════════════════════════════

  describe('Scenario 1: Pickup Validation — 5-mile rejection', () => {
    
    test('REJECT: Hotel 5 miles from Strip → GeoVerdict.withinRadius = false', () => {
      const store = useVegasStore.getState();

      let caughtError: BookingError | null = null;

      try {
        store.createBooking({
          slotId: 'slot-hd-empty',
          customerId: 'usr-explorer-01',
          passengerCount: 2,
          pickupLocation: {
            hotelName: 'Remote Motel (5mi out)',
            address: '1234 Henderson Ave',
            coordinates: FIVE_MILES_OUT,
          },
        });
      } catch (err) {
        caughtError = err as BookingError;
      }

      // Must have thrown
      expect(caughtError).toBeInstanceOf(BookingError);
      
      // Verdict must be attached
      expect(caughtError!.verdict).toBeDefined();
      
      // GeoVerdict shape: { withinRadius, distanceMiles, maxRadiusMiles }
      const geo = caughtError!.verdict as GeoVerdict;
      expect(geo.withinRadius).toBe(false);
      expect(geo.distanceMiles).toBeGreaterThan(2);
      expect(geo.maxRadiusMiles).toBe(2);

      console.log('✅ SCENARIO 1 — GeoVerdict:', JSON.stringify(geo, null, 2));
    });

    test('ACCEPT: Hotel on the Strip → booking succeeds', () => {
      const store = useVegasStore.getState();

      const result = store.createBooking({
        slotId: 'slot-hd-empty',
        customerId: 'usr-explorer-02',
        passengerCount: 1,
        pickupLocation: {
          hotelName: 'MGM Grand (On Strip)',
          address: '3799 S Las Vegas Blvd',
          coordinates: ON_STRIP,
        },
      });

      expect(result.bookingId).toBeDefined();
      expect(result.payment).toBeDefined();
      console.log('✅ On-strip booking accepted. ID:', result.bookingId);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 2: PaymentEngine — Deposit Threshold (BR-02)
  //
  // Rule: Tours more than 10 days away → 20% deposit.
  //       Tours within 10 days → 100% full payment.
  // ═══════════════════════════════════════════════════════════════

  describe('Scenario 2: Deposit Threshold — 20% vs 100%', () => {

    test('TOMORROW: Tour in <7 days → 100% payment due', () => {
      const store = useVegasStore.getState();

      // Set mockDate to today
      store.setMockDate(new Date().toISOString());

      // Create a slot for TOMORROW
      const tomorrowSlotId = store.createSlot({
        templateId: 'tmpl-hoover-dam',
        date: daysFromNow(1),
        guideId: 'usr-guide-02',
        vehicleId: 'veh-sprinter-01',
      });

      // Book 2 passengers at $119/person = $238 total
      const result = store.createBooking({
        slotId: tomorrowSlotId,
        customerId: 'usr-explorer-02',
        passengerCount: 2,
        pickupLocation: {
          hotelName: 'Bellagio',
          address: '3600 S Las Vegas Blvd',
          coordinates: ON_STRIP,
        },
      });

      // PaymentBreakdown: { totalAmount, depositRequired, isFullPaymentRequired, … }
      const payment = result.payment as PaymentBreakdown;
      expect(payment.isFullPaymentRequired).toBe(true);
      expect(payment.totalAmount).toBe(238);
      expect(payment.depositRequired).toBe(238); // 100% deposit = full amount
      expect(payment.daysUntilTour).toBeLessThanOrEqual(10);

      console.log('✅ SCENARIO 2a — Tomorrow payment:', JSON.stringify(payment, null, 2));
    });

    test('2 WEEKS OUT: Tour in >10 days → 20% deposit due', () => {
      const store = useVegasStore.getState();

      // Set mockDate to today
      store.setMockDate(new Date().toISOString());

      // Create a slot for 14 DAYS from now
      const futureSlotId = store.createSlot({
        templateId: 'tmpl-hoover-dam',
        date: daysFromNow(14),
        guideId: 'usr-guide-01',
        vehicleId: 'veh-sprinter-02',
      });

      // Book 2 passengers at $119/person = $238 total
      const result = store.createBooking({
        slotId: futureSlotId,
        customerId: 'usr-explorer-02',
        passengerCount: 2,
        pickupLocation: {
          hotelName: 'Caesars Palace',
          address: '3570 S Las Vegas Blvd',
          coordinates: ON_STRIP,
        },
      });

      // PaymentBreakdown: 20% deposit
      const payment = result.payment as PaymentBreakdown;
      expect(payment.isFullPaymentRequired).toBe(false);
      expect(payment.totalAmount).toBe(238);
      expect(payment.depositRequired).toBeCloseTo(238 * 0.2, 2); // $47.60
      expect(payment.daysUntilTour).toBeGreaterThan(10);

      console.log('✅ SCENARIO 2b — 2-week payment:', JSON.stringify(payment, null, 2));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCENARIO 3: TimeGuard — 48h Cancellation Lockout (BR-04)
  //
  // Rule: Bookings for tours within 48 hours cannot be cancelled.
  // ═══════════════════════════════════════════════════════════════

  describe('Scenario 3: 48h Cancellation Lockout', () => {

    test('LOCKED: Booking for tour in 24h → cancellation REJECTED', () => {
      const store = useVegasStore.getState();

      // Set mockDate to now
      store.setMockDate(new Date().toISOString());

      // Create a slot 24 hours from now (within 48h window)
      const slot24h = store.createSlot({
        templateId: 'tmpl-grand-canyon',
        date: hoursFromNow(24),
        guideId: 'usr-guide-01',
        vehicleId: 'veh-sprinter-01',
      });

      // Book it
      const { bookingId } = store.createBooking({
        slotId: slot24h,
        customerId: 'usr-explorer-01',
        passengerCount: 1,
        pickupLocation: {
          hotelName: 'Wynn Las Vegas',
          address: '3131 S Las Vegas Blvd',
          coordinates: ON_STRIP,
        },
      });

      // Attempt cancellation — cancelBooking returns a verdict, doesn't throw
      const verdict = store.cancelBooking(bookingId) as CancellationVerdict;
      
      expect(verdict.allowed).toBe(false);
      expect(verdict.hoursUntilTour).toBeLessThanOrEqual(48);
      expect(verdict.lockThresholdHours).toBe(48);

      console.log('✅ SCENARIO 3a — 24h lockout:', JSON.stringify(verdict, null, 2));
    });

    test('ALLOWED: Booking for tour in 5 days → cancellation ACCEPTED', () => {
      const store = useVegasStore.getState();

      // Set mockDate to now
      store.setMockDate(new Date().toISOString());

      // Create a slot 5 days from now (outside 48h window)
      const slot5d = store.createSlot({
        templateId: 'tmpl-grand-canyon',
        date: daysFromNow(5),
        guideId: 'usr-guide-02',
        vehicleId: 'veh-sprinter-02',
      });

      // Book it
      const { bookingId } = store.createBooking({
        slotId: slot5d,
        customerId: 'usr-explorer-02',
        passengerCount: 2,
        pickupLocation: {
          hotelName: 'Aria Resort',
          address: '3730 S Las Vegas Blvd',
          coordinates: ON_STRIP,
        },
      });

      // Process deposit so there's something to refund
      // Re-read state to get the booking
      const updatedStore = useVegasStore.getState();
      const booking = updatedStore.bookings.find(b => b.id === bookingId)!;
      expect(booking).toBeDefined();

      updatedStore.processPayment(bookingId, booking.totalAmount * 0.2);

      // Cancel — should succeed
      const finalStore = useVegasStore.getState();
      const verdict = finalStore.cancelBooking(bookingId);

      expect(verdict.allowed).toBe(true);
      expect(verdict.refundAmount).toBeGreaterThan(0);
      expect(verdict.hoursUntilTour).toBeGreaterThan(48);

      console.log('✅ SCENARIO 3b — 5-day cancel:', JSON.stringify(verdict, null, 2));
    });
  });
});
