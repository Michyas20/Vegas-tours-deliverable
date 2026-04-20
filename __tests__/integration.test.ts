// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Full Integration Test: Dual-Role Verification
//
// Role 1: Concierge — Explorer booking instantly visible in Admin
// Role 2: Ghost System — Time-Warp + Auto-Collector (Settlement)
// ═══════════════════════════════════════════════════════════════════

import { describe, test, expect, beforeEach } from 'vitest';
import { useVegasStore } from '@/lib/useVegasStore';

const DAY_MS = 86_400_000;
const ON_STRIP = { lat: 36.1129, lng: -115.1765 }; // Bellagio

describe('DUAL-ROLE INTEGRATION', () => {

  beforeEach(() => {
    useVegasStore.setState(useVegasStore.getInitialState());
  });

  // ═══════════════════════════════════════════════════════════════
  // ROLE 1: THE CONCIERGE — Explorer → Admin Verification
  // ═══════════════════════════════════════════════════════════════

  describe('Role 1: Concierge — Cross-Role State Sync', () => {

    test('Explorer booking is instantly visible in Admin capacity + manifest + audit', () => {
      const store = useVegasStore.getState();

      // ── Setup: Record initial state ──
      const slotBefore = store.slots.find(s => s.id === 'slot-hd-empty')!;
      const initialCapacity = slotBefore.currentCapacity;
      const initialAuditCount = store.auditLog.length;
      const initialBookingCount = store.bookings.length;

      console.log('═══ ROLE 1: CONCIERGE VERIFICATION ═══');
      console.log(`📊 Initial capacity: ${initialCapacity}/${slotBefore.maxCapacity}`);
      console.log(`📋 Initial bookings: ${initialBookingCount}`);
      console.log(`📝 Initial audit entries: ${initialAuditCount}`);

      // ── Explorer Action: Book 2 passengers at Bellagio ──
      const result = store.createBooking({
        slotId: 'slot-hd-empty',
        customerId: 'usr-explorer-01',
        passengerCount: 2,
        pickupLocation: {
          hotelName: 'Bellagio',
          address: '3600 S Las Vegas Blvd',
          coordinates: ON_STRIP,
        },
      });

      console.log(`\n✅ Booking created: ${result.bookingId}`);
      console.log(`💰 Payment: $${result.payment.totalAmount} total, $${result.payment.depositRequired} deposit`);
      console.log(`📅 Full payment required: ${result.payment.isFullPaymentRequired}`);

      // ── Simulate payment (deposit) ──
      store.processPayment(result.bookingId, result.payment.depositRequired);
      console.log(`💳 Deposit processed: $${result.payment.depositRequired}`);

      // ── Admin Verification: Capacity ──
      const storeAfter = useVegasStore.getState();
      const slotAfter = storeAfter.slots.find(s => s.id === 'slot-hd-empty')!;

      console.log(`\n══ ADMIN VIEW ══`);
      console.log(`📊 Capacity after: ${slotAfter.currentCapacity}/${slotAfter.maxCapacity}`);

      expect(slotAfter.currentCapacity).toBe(initialCapacity + 2);
      console.log(`✅ PASS: Capacity jumped by 2 (${initialCapacity} → ${slotAfter.currentCapacity})`);

      // ── Admin Verification: Manifest ──
      const slotBookings = storeAfter.getBookingsForSlot('slot-hd-empty');
      const newBooking = slotBookings.find(b => b.id === result.bookingId)!;

      expect(newBooking).toBeDefined();
      expect(newBooking.passengerCount).toBe(2);
      expect(newBooking.pickupLocation.hotelName).toBe('Bellagio');
      expect(newBooking.paymentStatus).toBe('DEPOSIT_PAID');
      expect(newBooking.amountPaid).toBe(result.payment.depositRequired);

      console.log(`\n📜 MANIFEST for slot-hd-empty:`);
      slotBookings.forEach(b => {
        const user = storeAfter.users.find(u => u.id === b.customerId);
        console.log(`  👤 ${user?.name || b.customerId} | ${b.passengerCount} pax | ${b.pickupLocation.hotelName} | ${b.paymentStatus} | $${b.amountPaid}/$${b.totalAmount}`);
      });
      console.log(`✅ PASS: New booking visible in manifest with correct details`);

      // ── Admin Verification: Audit Log ──
      const newAuditEntries = storeAfter.auditLog.slice(initialAuditCount);

      console.log(`\n📝 NEW AUDIT ENTRIES:`);
      newAuditEntries.forEach(entry => {
        console.log(`  [${entry.action}] ${entry.details}`);
      });

      const hasBookingCreated = newAuditEntries.some(e => e.action === 'BOOKING_CREATED');
      const hasPaymentDeposit = newAuditEntries.some(e => e.action === 'PAYMENT_DEPOSIT');

      expect(hasBookingCreated).toBe(true);
      expect(hasPaymentDeposit).toBe(true);
      console.log(`✅ PASS: BOOKING_CREATED + PAYMENT_DEPOSIT audit entries found`);

      // ── State Sync: Zero lag ──
      // Since Zustand is synchronous, the Admin sees changes immediately
      // (no refresh needed, no async delay)
      expect(storeAfter.bookings.length).toBe(initialBookingCount + 1);
      console.log(`\n✅ ROLE 1 COMPLETE: Zero lag. ${storeAfter.bookings.length} total bookings visible.`);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ROLE 2: THE GHOST SYSTEM — Settlement Verification
  // ═══════════════════════════════════════════════════════════════

  describe('Role 2: Ghost System — Time-Warp + Auto-Collector', () => {

    test('Settlement auto-collects 80% balance when tour is within 7 days', () => {
      const store = useVegasStore.getState();

      console.log('\n═══ ROLE 2: GHOST SYSTEM VERIFICATION ═══');

      // ── Setup: Verify seed booking exists ──
      const seedBooking = store.bookings.find(b => b.id === 'bk-deposit-01')!;
      expect(seedBooking).toBeDefined();
      expect(seedBooking.paymentStatus).toBe('DEPOSIT_PAID');

      const seedSlot = store.slots.find(s => s.id === seedBooking.slotId)!;
      const tourDate = new Date(seedSlot.date);

      console.log(`📋 Seed booking: ${seedBooking.id}`);
      console.log(`   Status: ${seedBooking.paymentStatus}`);
      console.log(`   Paid: $${seedBooking.amountPaid} / $${seedBooking.totalAmount}`);
      console.log(`   Outstanding: $${(seedBooking.totalAmount - seedBooking.amountPaid).toFixed(2)}`);
      console.log(`   Tour date: ${tourDate.toLocaleDateString()}`);

      // ── Step 1: Set mockDate to today (April 19/20, 2026) ──
      const today = new Date();
      store.setMockDate(today.toISOString());
      console.log(`\n⏰ mockDate set to: ${today.toLocaleDateString()} (today)`);

      // ── Step 2: Try settlement BEFORE time-warp (too early) ──
      const earlyResult = store.runDailySettlement();
      console.log(`\n🔄 Settlement attempt (before warp): ${earlyResult} bookings settled`);

      // Check if tour is more than 7 days away
      const daysToTour = Math.floor((tourDate.getTime() - today.getTime()) / DAY_MS);
      console.log(`   Days to tour: ${daysToTour}`);

      if (daysToTour > 7) {
        expect(earlyResult).toBe(0);
        console.log(`✅ PASS: No settlement — tour is ${daysToTour} days away (> 7 day window)`);

        // Verify booking is still DEPOSIT_PAID
        const bookingStill = useVegasStore.getState().bookings.find(b => b.id === 'bk-deposit-01')!;
        expect(bookingStill.paymentStatus).toBe('DEPOSIT_PAID');
      }

      // ── Step 3: TIME WARP — move to 5 days before tour ──
      const warpDate = new Date(tourDate.getTime() - 5 * DAY_MS);
      store.setMockDate(warpDate.toISOString());
      console.log(`\n⏩ TIME WARP: mockDate moved to ${warpDate.toLocaleDateString()}`);
      console.log(`   Now ${5} days before tour (within 7-day window)`);

      const auditBefore = useVegasStore.getState().auditLog.length;

      // ── Step 4: Run Daily Settlement ──
      const warpedStore = useVegasStore.getState();
      const settleResult = warpedStore.runDailySettlement();
      console.log(`\n⚡ Settlement triggered: ${settleResult} booking(s) auto-collected`);

      expect(settleResult).toBeGreaterThanOrEqual(1);
      console.log(`✅ PASS: Settlement processed ${settleResult} booking(s)`);

      // ── Step 5: Verify booking flipped to FULLY_PAID ──
      const finalStore = useVegasStore.getState();
      const settledBooking = finalStore.bookings.find(b => b.id === 'bk-deposit-01')!;

      expect(settledBooking.paymentStatus).toBe('FULLY_PAID');
      expect(settledBooking.amountPaid).toBe(settledBooking.totalAmount);

      console.log(`\n📋 Settled booking state:`);
      console.log(`   Status: ${settledBooking.paymentStatus}`);
      console.log(`   Paid: $${settledBooking.amountPaid} / $${settledBooking.totalAmount}`);
      console.log(`   Outstanding: $${(settledBooking.totalAmount - settledBooking.amountPaid).toFixed(2)}`);
      console.log(`✅ PASS: Status flipped from DEPOSIT_PAID → FULLY_PAID`);

      // ── Step 6: Verify Audit Log ──
      const newAuditEntries = finalStore.auditLog.slice(auditBefore);

      console.log(`\n📝 SETTLEMENT AUDIT ENTRIES:`);
      newAuditEntries.forEach(entry => {
        console.log(`  [${entry.action}] ${entry.details}`);
      });

      const hasAutoCollect = newAuditEntries.some(
        e => e.action === 'PAYMENT_FULL' && e.details.includes('Auto-settlement')
      );
      expect(hasAutoCollect).toBe(true);

      const systemEntry = newAuditEntries.find(e => e.details.includes('Auto-settlement'));
      expect(systemEntry?.userId).toBe('SYSTEM');

      console.log(`✅ PASS: PAYMENT_FULL (Auto-settlement) audit entry by SYSTEM found`);
      console.log(`\n✅ ROLE 2 COMPLETE: Ghost system correctly time-warped and auto-collected.`);
    });
  });
});
