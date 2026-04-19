// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Deterministic Seed Data
// Layer: Shared (consumed by L2 Store)
//
// All dates are relative to "now" for consistent demo state.
// Edge cases deliberately seeded: full slots, maintenance, underage.
// ═══════════════════════════════════════════════════════════════════

import type { User, TourTemplate, TourSlot, Vehicle, Booking } from '@/types';

// ─── Time Helpers (relative to import time) ────────────────────

const DAY_MS = 86_400_000;
const now = Date.now();

function daysFromNow(days: number): string {
  return new Date(now + days * DAY_MS).toISOString();
}

function daysAgo(days: number): string {
  return new Date(now - days * DAY_MS).toISOString();
}

// ─── Users ──────────────────────────────────────────────────────

export const SEED_USERS: User[] = [
  {
    id: 'usr-explorer-01',
    name: 'Alex Rivera',
    email: 'alex@explorer.com',
    role: 'EXPLORER',
    phone: '+1-702-555-0101',
  },
  {
    id: 'usr-explorer-02',
    name: 'Jordan Park',
    email: 'jordan@explorer.com',
    role: 'EXPLORER',
    phone: '+1-702-555-0102',
  },
  {
    id: 'usr-guide-01',
    name: 'Marcus Chen',
    email: 'marcus@vegastours.com',
    role: 'GUIDE',
    phone: '+1-702-555-0201',
  },
  {
    id: 'usr-guide-02',
    name: 'Sarah Winters',
    email: 'sarah@vegastours.com',
    role: 'GUIDE',
    phone: '+1-702-555-0202',
  },
  {
    id: 'usr-concierge-01',
    name: 'Diana Montoya',
    email: 'diana@vegastours.com',
    role: 'CONCIERGE',
    phone: '+1-702-555-0301',
  },
];

// ─── Tour Templates (Catalog) ───────────────────────────────────

export const SEED_TEMPLATES: TourTemplate[] = [
  {
    id: 'tmpl-grand-canyon',
    title: 'Grand Canyon Day Trip',
    description:
      'Experience the breathtaking views of the Grand Canyon West Rim with stops at the Skywalk, Eagle Point, and Guano Point. Includes a scenic drive through the Mojave Desert.',
    itinerary: [
      'Las Vegas Hotel Pickup',
      'Mojave Desert Scenic Drive',
      'Grand Canyon West Rim',
      'Eagle Point & Skywalk',
      'Guano Point',
      'Return to Las Vegas',
    ],
    durationHours: 10,
    basePricePerPerson: 189,
    minAge: 5,
    inclusions: ['Snacks', 'Bottled Water', 'Hotel Pickup', 'Lunch', 'Park Entry'],
  },
  {
    id: 'tmpl-downtown-night',
    title: 'Downtown Neon Night Tour',
    description:
      'Explore the dazzling lights of Fremont Street and old downtown Vegas. See the iconic neon signs, visit famous bars, and experience the Viva Vision light show.',
    itinerary: [
      'Hotel Pickup',
      'Welcome to Las Vegas Sign',
      'Fremont Street Experience',
      'Neon Museum Photo Stop',
      'Downtown Cocktail Room',
      'Return to Hotel',
    ],
    durationHours: 4,
    basePricePerPerson: 79,
    minAge: 12, // Night tour — no young children
    inclusions: ['Welcome Drink', 'Hotel Pickup', 'Photo Guide'],
  },
  {
    id: 'tmpl-hoover-dam',
    title: 'Hoover Dam Express',
    description:
      'A half-day tour to the engineering marvel of the Hoover Dam. Walk across the bridge, see the dam up close, and learn about its history from your expert guide.',
    itinerary: [
      'Hotel Pickup',
      'Lake Mead Scenic Viewpoint',
      'Hoover Dam Bridge Walk',
      'Dam Tour & Visitor Center',
      'Return to Las Vegas',
    ],
    durationHours: 5,
    basePricePerPerson: 119,
    minAge: 5,
    inclusions: ['Snacks', 'Water', 'Hotel Pickup', 'Dam Entry Ticket'],
  },
];

// ─── Vehicles (Fleet) ───────────────────────────────────────────

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'veh-sprinter-01',
    name: 'Sprinter Van #1',
    capacity: 14,
    status: 'AVAILABLE',
    licensePlate: 'NV-VT-001',
  },
  {
    id: 'veh-sprinter-02',
    name: 'Sprinter Van #2',
    capacity: 14,
    status: 'IN_USE',
    licensePlate: 'NV-VT-002',
  },
  {
    id: 'veh-sprinter-03',
    name: 'Sprinter Van #3',
    capacity: 14,
    status: 'MAINTENANCE',
    licensePlate: 'NV-VT-003',
  },
];

// ─── Tour Slots (Scheduled Instances) ───────────────────────────

export const SEED_SLOTS: TourSlot[] = [
  {
    // Edge case: FULL SLOT (14/14)
    id: 'slot-gc-full',
    templateId: 'tmpl-grand-canyon',
    date: daysFromNow(3),
    guideId: 'usr-guide-01',
    vehicleId: 'veh-sprinter-01',
    maxCapacity: 14,
    currentCapacity: 14,
    status: 'SCHEDULED',
  },
  {
    // Edge case: NEAR-FULL SLOT (12/14)
    id: 'slot-gc-nearfull',
    templateId: 'tmpl-grand-canyon',
    date: daysFromNow(7),
    guideId: 'usr-guide-01',
    vehicleId: 'veh-sprinter-01',
    maxCapacity: 14,
    currentCapacity: 12,
    status: 'SCHEDULED',
  },
  {
    // Happy path: EMPTY SLOT (0/14), far future
    id: 'slot-hd-empty',
    templateId: 'tmpl-hoover-dam',
    date: daysFromNow(15),
    guideId: 'usr-guide-02',
    vehicleId: 'veh-sprinter-02',
    maxCapacity: 14,
    currentCapacity: 0,
    status: 'SCHEDULED',
  },
  {
    // Edge case: MAINTENANCE SLOT
    id: 'slot-dn-maintenance',
    templateId: 'tmpl-downtown-night',
    date: daysFromNow(5),
    guideId: 'usr-guide-02',
    vehicleId: 'veh-sprinter-03',
    maxCapacity: 14,
    currentCapacity: 0,
    status: 'MAINTENANCE',
  },
  {
    // Edge case: COMPLETED SLOT (past)
    id: 'slot-gc-completed',
    templateId: 'tmpl-grand-canyon',
    date: daysAgo(2),
    guideId: 'usr-guide-01',
    vehicleId: 'veh-sprinter-01',
    maxCapacity: 14,
    currentCapacity: 10,
    status: 'COMPLETED',
  },
];

// ─── Bookings (Transactional Data) ──────────────────────────────

export const SEED_BOOKINGS: Booking[] = [
  {
    // Edge case: Deposit-only booking (tour > 10 days out)
    id: 'bk-deposit-01',
    slotId: 'slot-hd-empty',
    customerId: 'usr-explorer-01',
    passengerCount: 4,
    totalAmount: 476, // 119 × 4
    amountPaid: 95.20, // 20% deposit
    paymentStatus: 'DEPOSIT_PAID',
    pickupLocation: {
      hotelName: 'Bellagio',
      address: '3600 S Las Vegas Blvd',
      coordinates: { lat: 36.1129, lng: -115.1765 },
    },
    createdAt: daysAgo(1),
    specialRequirements: 'Wheelchair accessible seating needed',
  },
  {
    // Happy path: Fully paid booking
    id: 'bk-fullpay-01',
    slotId: 'slot-gc-nearfull',
    customerId: 'usr-explorer-02',
    passengerCount: 2,
    totalAmount: 378, // 189 × 2
    amountPaid: 378,
    paymentStatus: 'FULLY_PAID',
    pickupLocation: {
      hotelName: 'MGM Grand',
      address: '3799 S Las Vegas Blvd',
      coordinates: { lat: 36.1024, lng: -115.1695 },
    },
    createdAt: daysAgo(3),
  },
  {
    // Edge case: Pending booking (awaiting payment)
    id: 'bk-pending-01',
    slotId: 'slot-gc-nearfull',
    customerId: 'usr-explorer-01',
    passengerCount: 3,
    totalAmount: 567, // 189 × 3
    amountPaid: 0,
    paymentStatus: 'PENDING',
    pickupLocation: {
      hotelName: 'Caesars Palace',
      address: '3570 S Las Vegas Blvd',
      coordinates: { lat: 36.1162, lng: -115.1745 },
    },
    createdAt: new Date().toISOString(),
  },
];
