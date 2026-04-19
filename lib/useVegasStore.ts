// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Zustand Store (L2 Navigation Layer)
//
// Orchestration layer: calls L1 assertion engines, manages state
// transitions, and enforces the assert-then-mutate pattern.
//
// CRITICAL INVARIANT: State mutations ONLY happen after ALL
// L1 assertions pass. No partial mutations.
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  UserRole,
  TourTemplate,
  TourSlot,
  Booking,
  Vehicle,
  AuditEntry,
  PickupLocation,
  PaymentBreakdown,
  CancellationVerdict,
  CapacityVerdict,
  GeoVerdict,
} from '@/types';

// ─── L1 Engine Imports ──────────────────────────────────────────
import { validateBooking, validateMinAge } from '@/lib/engines/capacity.engine';
import { calculatePayment, calculateRefund } from '@/lib/engines/payment.engine';
import { validatePickup } from '@/lib/engines/geo.validator';
import { canCancel, isBookable } from '@/lib/engines/time.guard';

// ─── Seed Data ──────────────────────────────────────────────────
import {
  SEED_USERS,
  SEED_TEMPLATES,
  SEED_SLOTS,
  SEED_VEHICLES,
  SEED_BOOKINGS,
} from '@/lib/seed/mock-data';

// ─── Utility ────────────────────────────────────────────────────
import { generateId } from '@/lib/utils';

// ─── Error Types ────────────────────────────────────────────────

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly verdict?: CapacityVerdict | GeoVerdict | CancellationVerdict
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

// ─── Store Shape ────────────────────────────────────────────────

interface VegasStore {
  // ── Data Arrays ────────────────────────────────────────────────
  users: User[];
  templates: TourTemplate[];
  slots: TourSlot[];
  bookings: Booking[];
  vehicles: Vehicle[];
  auditLog: AuditEntry[];

  // ── Role State ─────────────────────────────────────────────────
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // ── Simulation Clock ───────────────────────────────────────────
  mockDateISO: string;
  setMockDate: (iso: string) => void;

  // ── Booking Flow ───────────────────────────────────────────────

  /**
   * Creates a new booking. Orchestrates L1 calls in sequence:
   * 1. TimeGuard.isBookable()          → Tour must be in the future
   * 2. CapacityEngine.validateBooking() → 14-Cap enforcement
   * 3. GeoValidator.validatePickup()    → 2-Mile Rule (if coordinates)
   * 4. PaymentEngine.calculatePayment() → Deposit vs full payment
   *
   * On success: creates booking, increments slot capacity, writes audit.
   * On failure: throws BookingError with the failing verdict.
   */
  createBooking: (data: {
    slotId: string;
    customerId: string;
    passengerCount: number;
    pickupLocation: PickupLocation;
    specialRequirements?: string;
    passengerAges?: number[];
  }) => { bookingId: string; payment: PaymentBreakdown };

  /**
   * Cancels a booking. Orchestrates:
   * 1. TimeGuard.canCancel() → 48h Lock
   * 2. PaymentEngine.calculateRefund() → Refund calculation
   * 3. Decrements slot capacity, updates booking status, writes audit
   */
  cancelBooking: (bookingId: string) => CancellationVerdict & { refundAmount?: number };

  /**
   * Processes a payment against a booking.
   * PENDING → DEPOSIT_PAID (deposit amount)
   * DEPOSIT_PAID → FULLY_PAID (remaining balance)
   */
  processPayment: (bookingId: string, amount: number) => void;

  // ── Slot Management ────────────────────────────────────────────

  /** Creates a new tour slot from a template. CONCIERGE only. */
  createSlot: (data: {
    templateId: string;
    date: string;
    guideId: string;
    vehicleId: string;
  }) => string;

  /** Marks a slot as MAINTENANCE (blocks new bookings). */
  setSlotMaintenance: (slotId: string) => void;

  /** Marks a slot as COMPLETED (after tour execution). */
  completeSlot: (slotId: string) => void;

  // ── Template Management ─────────────────────────────────────────

  /** Creates a new TourTemplate. Returns the new template ID. */
  addTemplate: (data: Omit<TourTemplate, 'id'>) => string;

  /**
   * Updates an existing TourTemplate by ID.
   * CONSTRAINT: Does NOT touch existing bookings — price changes
   * only apply to FUTURE bookings (totalAmount is snapshot at creation).
   */
  updateTemplate: (id: string, updates: Partial<Omit<TourTemplate, 'id'>>) => void;

  /** Deletes a TourTemplate by ID. Does NOT cascade to slots/bookings. */
  deleteTemplate: (id: string) => void;

  // ── Query Helpers ──────────────────────────────────────────────

  /** Returns all bookings for a given slot ID */
  getBookingsForSlot: (slotId: string) => Booking[];

  /** Returns all slots assigned to a guide */
  getSlotsForGuide: (guideId: string) => TourSlot[];

  /** Returns the TourTemplate for a given slot */
  getTemplateForSlot: (slotId: string) => TourTemplate | undefined;

  /** Returns all available (SCHEDULED, future) slots */
  getAvailableSlots: () => TourSlot[];

  /** Returns all bookings for a customer */
  getBookingsForCustomer: (customerId: string) => Booking[];
}

// ─── Store Implementation ───────────────────────────────────────

export const useVegasStore = create<VegasStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────────
      users: SEED_USERS,
      templates: SEED_TEMPLATES,
      slots: SEED_SLOTS,
      bookings: SEED_BOOKINGS,
      vehicles: SEED_VEHICLES,
      auditLog: [],
      currentRole: 'EXPLORER',
      mockDateISO: new Date().toISOString(),

      // ── Role Switching ───────────────────────────────────────────
      setCurrentRole: (role) => set({ currentRole: role }),

      // ── Simulation Clock ─────────────────────────────────────────
      setMockDate: (iso) => set({ mockDateISO: iso }),

      // ═══════════════════════════════════════════════════════════════
      // BOOKING FLOW: Assert-Then-Mutate Pattern
      // ═══════════════════════════════════════════════════════════════

      createBooking: (data) => {
        const state = get();

        // ── Resolve entities ────────────────────────────────────────
        const slot = state.slots.find((s) => s.id === data.slotId);
        if (!slot) throw new BookingError('Tour slot not found');

        const template = state.templates.find((t) => t.id === slot.templateId);
        if (!template) throw new BookingError('Tour template not found');

        // ═══ ASSERTION PHASE (L1 calls — any failure = hard stop) ═══

        // 1. TIME GUARD: Is the tour in the future?
        if (!isBookable(slot.date, state.mockDateISO)) {
          throw new BookingError('Tour date has already passed');
        }

        // 2. CAPACITY ENGINE: Does this fit within the 14-Cap?
        const capacityVerdict = validateBooking(slot, data.passengerCount);
        if (!capacityVerdict.allowed) {
          throw new BookingError(
            capacityVerdict.reason || 'Capacity check failed',
            capacityVerdict
          );
        }

        // 3. MIN AGE CHECK: Do all passengers meet the age requirement?
        if (data.passengerAges) {
          const ageVerdict = validateMinAge(template.minAge, data.passengerAges);
          if (!ageVerdict.allowed) {
            throw new BookingError(ageVerdict.reason || 'Age check failed');
          }
        }

        // 4. GEO VALIDATOR: Is the pickup within 2 miles of the Strip?
        if (data.pickupLocation.coordinates) {
          const geoVerdict = validatePickup(data.pickupLocation.coordinates);
          if (!geoVerdict.withinRadius) {
            throw new BookingError(
              `Pickup location is ${geoVerdict.distanceMiles} miles from the Strip (max: ${geoVerdict.maxRadiusMiles} miles)`,
              geoVerdict
            );
          }
        }

        // ═══ CALCULATION PHASE (L1 — pure computation) ═════════════

        const payment = calculatePayment(
          template.basePricePerPerson,
          data.passengerCount,
          state.mockDateISO,
          slot.date
        );

        // ═══ MUTATION PHASE (L2 — only after ALL assertions pass) ══

        const bookingId = generateId('bk');
        const auditId = generateId('audit');

        const newBooking: Booking = {
          id: bookingId,
          slotId: data.slotId,
          customerId: data.customerId,
          passengerCount: data.passengerCount,
          totalAmount: payment.totalAmount,
          amountPaid: 0,
          paymentStatus: 'PENDING',
          pickupLocation: data.pickupLocation,
          createdAt: state.mockDateISO,
          specialRequirements: data.specialRequirements,
        };

        const auditEntry: AuditEntry = {
          id: auditId,
          timestamp: state.mockDateISO,
          action: 'BOOKING_CREATED',
          entityId: bookingId,
          entityType: 'BOOKING',
          details: `Booking created: ${data.passengerCount} passengers for slot ${data.slotId}. Total: $${payment.totalAmount}. Deposit required: $${payment.depositRequired}.`,
          userId: data.customerId,
        };

        set((state) => ({
          bookings: [...state.bookings, newBooking],
          slots: state.slots.map((s) =>
            s.id === data.slotId
              ? { ...s, currentCapacity: s.currentCapacity + data.passengerCount }
              : s
          ),
          auditLog: [...state.auditLog, auditEntry],
        }));

        return { bookingId, payment };
      },

      // ═══════════════════════════════════════════════════════════════
      // CANCEL BOOKING: 48h Lock + Refund
      // ═══════════════════════════════════════════════════════════════

      cancelBooking: (bookingId) => {
        const state = get();

        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking) {
          return {
            allowed: false,
            reason: 'Booking not found',
            hoursUntilTour: 0,
            lockThresholdHours: 48,
          };
        }

        if (booking.paymentStatus === 'CANCELLED') {
          return {
            allowed: false,
            reason: 'Booking is already cancelled',
            hoursUntilTour: 0,
            lockThresholdHours: 48,
          };
        }

        const slot = state.slots.find((s) => s.id === booking.slotId);
        if (!slot) {
          return {
            allowed: false,
            reason: 'Associated tour slot not found',
            hoursUntilTour: 0,
            lockThresholdHours: 48,
          };
        }

        // ═══ ASSERTION: 48h Lock ══════════════════════════════════════
        const cancellationVerdict = canCancel(slot.date, state.mockDateISO);

        if (!cancellationVerdict.allowed) {
          return cancellationVerdict;
        }

        // ═══ CALCULATION: Refund ══════════════════════════════════════
        const refund = calculateRefund(booking);

        // ═══ MUTATION ═════════════════════════════════════════════════
        const auditId = generateId('audit');

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? { ...b, paymentStatus: 'CANCELLED' as const }
              : b
          ),
          slots: state.slots.map((s) =>
            s.id === booking.slotId
              ? {
                ...s,
                currentCapacity: Math.max(0, s.currentCapacity - booking.passengerCount),
              }
              : s
          ),
          auditLog: [
            ...state.auditLog,
            {
              id: auditId,
              timestamp: state.mockDateISO,
              action: 'BOOKING_CANCELLED' as const,
              entityId: bookingId,
              entityType: 'BOOKING' as const,
              details: `Booking cancelled. Refund: $${refund.refundAmount.toFixed(2)} (${refund.refundPercentage}%)`,
              userId: booking.customerId,
            },
          ],
        }));

        return {
          ...cancellationVerdict,
          refundAmount: refund.refundAmount,
        };
      },

      // ═══════════════════════════════════════════════════════════════
      // PROCESS PAYMENT
      // ═══════════════════════════════════════════════════════════════

      processPayment: (bookingId, amount) => {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking) throw new BookingError('Booking not found');

        if (booking.paymentStatus === 'CANCELLED') {
          throw new BookingError('Cannot process payment for a cancelled booking');
        }

        if (booking.paymentStatus === 'FULLY_PAID') {
          throw new BookingError('Booking is already fully paid');
        }

        const newAmountPaid = booking.amountPaid + amount;
        let newStatus = booking.paymentStatus;

        if (newAmountPaid >= booking.totalAmount) {
          newStatus = 'FULLY_PAID';
        } else if (newAmountPaid > 0 && booking.paymentStatus === 'PENDING') {
          newStatus = 'DEPOSIT_PAID';
        }

        const auditAction = newStatus === 'FULLY_PAID' ? 'PAYMENT_FULL' : 'PAYMENT_DEPOSIT';
        const auditId = generateId('audit');

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? {
                ...b,
                amountPaid: Math.min(newAmountPaid, booking.totalAmount),
                paymentStatus: newStatus,
              }
              : b
          ),
          auditLog: [
            ...state.auditLog,
            {
              id: auditId,
              timestamp: state.mockDateISO,
              action: auditAction,
              entityId: bookingId,
              entityType: 'BOOKING' as const,
              details: `Payment of $${amount.toFixed(2)} processed. Total paid: $${Math.min(newAmountPaid, booking.totalAmount).toFixed(2)}/${booking.totalAmount.toFixed(2)}`,
              userId: booking.customerId,
            },
          ],
        }));
      },

      // ═══════════════════════════════════════════════════════════════
      // SLOT MANAGEMENT
      // ═══════════════════════════════════════════════════════════════

      createSlot: (data) => {
        const state = get();
        const template = state.templates.find((t) => t.id === data.templateId);
        if (!template) throw new BookingError('Template not found');

        const guide = state.users.find((u) => u.id === data.guideId && u.role === 'GUIDE');
        if (!guide) throw new BookingError('Guide not found or user is not a guide');

        const vehicle = state.vehicles.find((v) => v.id === data.vehicleId);
        if (!vehicle) throw new BookingError('Vehicle not found');

        const slotId = generateId('slot');
        const auditId = generateId('audit');

        const newSlot: TourSlot = {
          id: slotId,
          templateId: data.templateId,
          date: data.date,
          guideId: data.guideId,
          vehicleId: data.vehicleId,
          maxCapacity: vehicle.capacity,
          currentCapacity: 0,
          status: 'SCHEDULED',
        };

        set((state) => ({
          slots: [...state.slots, newSlot],
          auditLog: [
            ...state.auditLog,
            {
              id: auditId,
              timestamp: state.mockDateISO,
              action: 'SLOT_CREATED' as const,
              entityId: slotId,
              entityType: 'SLOT' as const,
              details: `Slot created for "${template.title}" on ${data.date} with guide ${guide.name}`,
              userId: 'SYSTEM',
            },
          ],
        }));

        return slotId;
      },

      setSlotMaintenance: (slotId) => {
        const auditId = generateId('audit');

        set((state) => ({
          slots: state.slots.map((s) =>
            s.id === slotId ? { ...s, status: 'MAINTENANCE' as const } : s
          ),
          auditLog: [
            ...state.auditLog,
            {
              id: auditId,
              timestamp: state.mockDateISO,
              action: 'SLOT_MAINTENANCE' as const,
              entityId: slotId,
              entityType: 'SLOT' as const,
              details: `Slot ${slotId} set to MAINTENANCE`,
              userId: 'SYSTEM',
            },
          ],
        }));
      },

      completeSlot: (slotId) => {
        const auditId = generateId('audit');

        set((state) => ({
          slots: state.slots.map((s) =>
            s.id === slotId ? { ...s, status: 'COMPLETED' as const } : s
          ),
          auditLog: [
            ...state.auditLog,
            {
              id: auditId,
              timestamp: state.mockDateISO,
              action: 'SLOT_COMPLETED' as const,
              entityId: slotId,
              entityType: 'SLOT' as const,
              details: `Slot ${slotId} marked as COMPLETED`,
              userId: 'SYSTEM',
            },
          ],
        }));
      },

      // ═══════════════════════════════════════════════════════════════
      // TEMPLATE MANAGEMENT
      // ═══════════════════════════════════════════════════════════════

      addTemplate: (data) => {
        const templateId = generateId('tmpl');

        set((state) => ({
          templates: [...state.templates, { ...data, id: templateId }],
        }));

        return templateId;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      // ═══════════════════════════════════════════════════════════════
      // QUERY HELPERS (Pure reads — no mutations)
      // ═══════════════════════════════════════════════════════════════

      getBookingsForSlot: (slotId) => {
        return get().bookings.filter((b) => b.slotId === slotId);
      },

      getSlotsForGuide: (guideId) => {
        return get().slots.filter((s) => s.guideId === guideId);
      },

      getTemplateForSlot: (slotId) => {
        const slot = get().slots.find((s) => s.id === slotId);
        if (!slot) return undefined;
        return get().templates.find((t) => t.id === slot.templateId);
      },

      getAvailableSlots: () => {
        const { slots, mockDateISO } = get();
        return slots.filter(
          (s) => s.status === 'SCHEDULED' && isBookable(s.date, mockDateISO)
        );
      },

      getBookingsForCustomer: (customerId) => {
        return get().bookings.filter((b) => b.customerId === customerId);
      },
    }),
    {
      name: 'vegas-tours-store',
      partialize: (state) => ({
        templates: state.templates,
        bookings: state.bookings,
        slots: state.slots,
        auditLog: state.auditLog,
        mockDateISO: state.mockDateISO,
        currentRole: state.currentRole,
      }),
    }
  )
);
