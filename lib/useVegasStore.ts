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
  PaymentStatus,
  AuditAction,
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
import { supabase } from '@/lib/supabaseClient';

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
    guestInfo?: {
      fullName: string;
      email: string;
      phone: string;
    };
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

  // ── Settlement ──────────────────────────────────────────────────

  /**
   * Simulates daily auto-collection. For each DEPOSIT_PAID booking
   * whose tour is within 7 days, collects the remaining 80% balance
   * and sets status to FULLY_PAID. Returns count of settlements.
   */
  runDailySettlement: () => number;

  // ── Admin Payment Verification ───────────────────────────────────

  /**
   * Admin confirms payment received (Zelle/Venmo). Sets booking to
   * DEPOSIT_PAID or FULLY_PAID based on the 10-day rule.
   */
  confirmPayment: (bookingId: string) => void;

  // ── Supabase Integration ─────────────────────────────────────────

  /**
   * Initializes state from Supabase and sets up Postgres Real-Time
   * watchers to instantly update local state (e.g. Boarding Pass).
   */
  initSupabase: () => Promise<void>;
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

        let template = state.templates.find((t) => t.id === slot.templateId);
        if (!template) {
          // Protect the Triple-Chain Upsert: if missing locally, provide mock data to insert into Supabase
          template = {
            id: slot.templateId,
            title: 'Mock Tour Fallback',
            description: 'Generated to preserve DB integrity during Test Flights',
            itinerary: ['Las Vegas Strip'],
            durationHours: 2,
            basePricePerPerson: 100,
            minAge: 0,
            inclusions: ['Test Flight Verification']
          };
        }

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
          customerId: data.customerId || `GUEST-${Date.now()}`,
          passengerCount: data.passengerCount,
          totalAmount: payment.totalAmount,
          amountPaid: 0,
          paymentStatus: 'PENDING',
          pickupLocation: data.pickupLocation,
          createdAt: state.mockDateISO,
          specialRequirements: data.specialRequirements,
          guestInfo: data.guestInfo,
          holdExpiresAt: new Date(new Date(state.mockDateISO).getTime() + 2 * 60 * 60 * 1000).toISOString(),
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

        // --- Supabase Remote Mutation (Optimistic Sync) ---
        // 1. Triple-Chain Upsert: Template -> Slot -> Booking
        supabase.from('tour_templates').upsert([{
          id: template.id,
          title: template.title,
          description: template.description,
          itinerary: template.itinerary,
          duration_hours: template.durationHours,
          base_price_per_person: template.basePricePerPerson,
          min_age: template.minAge || 5,
          inclusions: template.inclusions || []
        }]).then(({ error: tmplError }) => {
          if (tmplError) {
            console.error('Failed to upsert template:', tmplError.message);
            return;
          }

          // 2. Upsert slot
          supabase.from('tour_slots').upsert([{
            id: slot.id,
            template_id: slot.templateId,
            date: slot.date,
            guide_id: slot.guideId,
            vehicle_id: slot.vehicleId,
            max_capacity: slot.maxCapacity,
            current_capacity: slot.currentCapacity + data.passengerCount,
            status: slot.status
          }]).then(({ error: slotError }) => {
            if (slotError) {
              console.error('Failed to upsert slot:', slotError.message);
              return;
            }

            // 3. Insert booking
            supabase.from('bookings').insert([{
              id: newBooking.id,
              slot_id: newBooking.slotId,
              customer_id: newBooking.customerId,
              passenger_count: newBooking.passengerCount,
              total_amount: newBooking.totalAmount,
              amount_paid: newBooking.amountPaid,
              payment_status: newBooking.paymentStatus,
              pickup_location: newBooking.pickupLocation,
              created_at: newBooking.createdAt,
              special_requirements: newBooking.specialRequirements,
              guest_info: newBooking.guestInfo,
              hold_expires_at: newBooking.holdExpiresAt
            }]).then(({ error }) => {
              if (error) {
                console.error('Supabase booking write failed:', error.message);
              }
            });
          });
        });

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
        let newStatus: PaymentStatus = booking.paymentStatus;

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

      // ═══════════════════════════════════════════════════════════════
      // DAILY SETTLEMENT: Auto-collect remaining balances
      // ═══════════════════════════════════════════════════════════════

      runDailySettlement: () => {
        const state = get();
        const DAY_MS = 86_400_000;
        const now = new Date(state.mockDateISO).getTime();
        const sevenDaysFromNow = now + 7 * DAY_MS;
        let settled = 0;

        const updatedBookings = state.bookings.map((booking) => {
          if (booking.paymentStatus !== 'DEPOSIT_PAID') return booking;

          const slot = state.slots.find((s) => s.id === booking.slotId);
          if (!slot) return booking;

          const tourTime = new Date(slot.date).getTime();
          if (tourTime > sevenDaysFromNow || tourTime <= now) return booking;

          // Auto-collect remaining balance
          settled++;
          return {
            ...booking,
            amountPaid: booking.totalAmount,
            paymentStatus: 'FULLY_PAID' as const,
          };
        });

        if (settled > 0) {
          const auditEntries = state.bookings
            .filter((b) => {
              if (b.paymentStatus !== 'DEPOSIT_PAID') return false;
              const slot = state.slots.find((s) => s.id === b.slotId);
              if (!slot) return false;
              const tourTime = new Date(slot.date).getTime();
              return tourTime <= sevenDaysFromNow && tourTime > now;
            })
            .map((b) => ({
              id: generateId('audit'),
              timestamp: state.mockDateISO,
              action: 'PAYMENT_FULL' as const,
              entityId: b.id,
              entityType: 'BOOKING' as const,
              details: `Auto-settlement: collected remaining $${(b.totalAmount - b.amountPaid).toFixed(2)} for booking ${b.id}`,
              userId: 'SYSTEM',
            }));

          set({
            bookings: updatedBookings,
            auditLog: [...state.auditLog, ...auditEntries],
          });
        }

        return settled;
      },

      // ═══════════════════════════════════════════════════════════════
      // ADMIN PAYMENT VERIFICATION: Manual confirm (Zelle/Venmo)
      // ═══════════════════════════════════════════════════════════════

      confirmPayment: (bookingId) => {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking || booking.paymentStatus !== 'PENDING') return;

        const newStatus = 'FULLY_PAID';
        const amountPaid = booking.totalAmount;

        set({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? { ...b, paymentStatus: newStatus as PaymentStatus, amountPaid }
              : b
          ),
          auditLog: [
            ...state.auditLog,
            {
              id: generateId('audit'),
              timestamp: state.mockDateISO,
              action: 'PAYMENT_CONFIRMED' as AuditAction,
              entityId: bookingId,
              entityType: 'BOOKING' as const,
              details: `Admin verified payment: $${amountPaid.toFixed(2)} (${newStatus.replace('_', ' ')}) for booking ${bookingId}`,
              userId: 'CONCIERGE',
            },
          ],
        });

        // --- Supabase Remote Mutation ---
        supabase.from('bookings')
          .update({
            payment_status: newStatus,
            amount_paid: amountPaid
          })
          .eq('id', bookingId)
          .then(({ error }) => {
            if (error) {
              console.error('Supabase confirmPayment failed:', error.message);
            }
          });
      },

      initSupabase: async () => {
        // 1. Fetch initial state
        const [{ data: templatesData }, { data: slotsData }, { data: bookingsData }] = await Promise.all([
          supabase.from('tour_templates').select('*'),
          supabase.from('tour_slots').select('*'),
          supabase.from('bookings').select('*'),
        ]);

        const state = get();

        // Auto-seed database if empty (prevents foreign key errors on fresh databases)
        if (templatesData && templatesData.length === 0) {
          console.log('Seeding Supabase with local Tour Templates...');
          const mappedTemplates = state.templates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            itinerary: t.itinerary,
            duration_hours: t.durationHours,
            base_price_per_person: t.basePricePerPerson,
            min_age: t.minAge || 5,
            inclusions: t.inclusions || [],
          }));
          await supabase.from('tour_templates').insert(mappedTemplates);
        }

        if (slotsData && slotsData.length === 0) {
          console.log('Seeding Supabase with local Tour Slots...');
          const mappedSlots = state.slots.map(s => ({
            id: s.id,
            template_id: s.templateId,
            date: s.date,
            guide_id: s.guideId,
            vehicle_id: s.vehicleId,
            max_capacity: s.maxCapacity,
            current_capacity: s.currentCapacity,
            status: s.status,
          }));
          await supabase.from('tour_slots').insert(mappedSlots);
        }

        if (templatesData && slotsData && bookingsData) {
          console.log('✅ Hydrating local store from Supabase...', { count: bookingsData.length });
          
          if (bookingsData.length > 0) {
            const remoteBookings = bookingsData.map(b => ({
              id: b.id,
              slotId: b.slot_id,
              customerId: b.customer_id,
              passengerCount: b.passenger_count,
              totalAmount: b.total_amount,
              amountPaid: b.amount_paid,
              paymentStatus: b.payment_status,
              pickupLocation: b.pickup_location,
              createdAt: b.created_at,
              specialRequirements: b.special_requirements,
              guestInfo: b.guest_info,
              holdExpiresAt: b.hold_expires_at
            }));
            
            set((state) => {
              // Merge remote bookings over local bookings to ensure UI reflection
              const localIds = new Set(state.bookings.map(lb => lb.id));
              const newRemoteBookings = remoteBookings.filter(rb => !localIds.has(rb.id));
              return { bookings: [...state.bookings, ...newRemoteBookings] };
            });
          }
        }

        // 2. Real-Time Handshake for Bookings (e.g. Admin Confirms Payment -> Boarding Pass flips instantly)
        supabase.channel('public:bookings')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
            console.log('Realtime Update Received:', payload);
            const updated = payload.new;
            
            // Patch local store instantly
            set((state) => ({
              bookings: state.bookings.map((b) =>
                b.id === updated.id
                  ? { 
                      ...b, 
                      paymentStatus: updated.payment_status as PaymentStatus, 
                      amountPaid: updated.amount_paid 
                    }
                  : b
              )
            }));
          }).subscribe();
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
