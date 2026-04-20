// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Type Definitions (Source of Truth)
// Layer: Shared across L1 (Assertion), L2 (Navigation), L3 (Transaction)
// ═══════════════════════════════════════════════════════════════════

// ─── User & Roles ───────────────────────────────────────────────

export type UserRole = 'EXPLORER' | 'GUIDE' | 'CONCIERGE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

// ─── Tour Blueprint (Static Content) ────────────────────────────

export interface TourTemplate {
  id: string;
  title: string;
  description: string;
  itinerary: string[];          // e.g., ["Las Vegas Sign", "Hoover Dam", "Grand Canyon"]
  durationHours: number;
  basePricePerPerson: number;
  minAge: number;               // Default: 5
  inclusions: string[];         // e.g., ["Snacks", "Water", "Pickup"]
}

// ─── Tour Instance (Scheduled Event) ────────────────────────────

export type SlotStatus = 'SCHEDULED' | 'MAINTENANCE' | 'COMPLETED';

export interface TourSlot {
  id: string;
  templateId: string;
  date: string;                 // ISO 8601
  guideId: string;              // References a User with 'GUIDE' role
  vehicleId: string;
  maxCapacity: number;          // Default: 14
  currentCapacity: number;
  status: SlotStatus;
}

// ─── Booking & Payment ──────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'CANCELLED';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PickupLocation {
  hotelName: string;
  address: string;
  coordinates?: Coordinates;
}

export interface Booking {
  id: string;
  slotId: string;
  customerId: string;
  passengerCount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  pickupLocation: PickupLocation;
  createdAt: string;            // ISO 8601
  specialRequirements?: string;
  guestInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  holdExpiresAt?: string;       // ISO 8601 — spot hold timeout
}

// ─── Vehicle (Fleet) ────────────────────────────────────────────

export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';

export interface Vehicle {
  id: string;
  name: string;                 // e.g., "Sprinter Van #3"
  capacity: number;
  status: VehicleStatus;
  licensePlate: string;
}

// ─── Audit Log ──────────────────────────────────────────────────

export type AuditAction =
  | 'BOOKING_CREATED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_DEPOSIT'
  | 'PAYMENT_FULL'
  | 'PAYMENT_CONFIRMED'
  | 'SLOT_CREATED'
  | 'SLOT_MAINTENANCE'
  | 'SLOT_COMPLETED'
  | 'CAPACITY_ADJUSTED';

export interface AuditEntry {
  id: string;
  timestamp: string;            // ISO 8601
  action: AuditAction;
  entityId: string;
  entityType: 'BOOKING' | 'SLOT' | 'VEHICLE';
  details: string;
  userId: string;
}

// ─── L1 Engine Return Types ─────────────────────────────────────

/** Returned by CapacityEngine.validateBooking() */
export interface CapacityVerdict {
  allowed: boolean;
  reason?: string;
  remainingCapacity: number;
  requestedCount: number;
}

/** Returned by PaymentEngine.calculatePayment() */
export interface PaymentBreakdown {
  totalAmount: number;              // basePricePerPerson × passengerCount
  depositRequired: number;          // 20% of total, or 100% if within 10 days
  isFullPaymentRequired: boolean;   // true if tourDate - bookingDate <= 10 days
  daysUntilTour: number;
  pricePerPerson: number;
  passengerCount: number;
}

/** Returned by GeoValidator.validatePickup() */
export interface GeoVerdict {
  withinRadius: boolean;
  distanceMiles: number;
  maxRadiusMiles: number;           // Always 2.0
}

/** Returned by TimeGuard.canCancel() */
export interface CancellationVerdict {
  allowed: boolean;
  reason?: string;
  hoursUntilTour: number;
  lockThresholdHours: number;       // Always 48
}
