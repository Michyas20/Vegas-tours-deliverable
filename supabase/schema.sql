-- ─── Types & Enums ────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('EXPLORER', 'GUIDE', 'CONCIERGE');
CREATE TYPE slot_status AS ENUM ('SCHEDULED', 'MAINTENANCE', 'COMPLETED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'DEPOSIT_PAID', 'FULLY_PAID', 'CANCELLED');
CREATE TYPE vehicle_status AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');
CREATE TYPE audit_action AS ENUM (
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'PAYMENT_DEPOSIT',
  'PAYMENT_FULL',
  'PAYMENT_CONFIRMED',
  'SLOT_CREATED',
  'SLOT_MAINTENANCE',
  'SLOT_COMPLETED',
  'CAPACITY_ADJUSTED'
);

-- ─── Tables ───────────────────────────────────────────────────────

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  phone TEXT
);

CREATE TABLE tour_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  itinerary TEXT[] NOT NULL,
  duration_hours INTEGER NOT NULL,
  base_price_per_person NUMERIC(10,2) NOT NULL,
  min_age INTEGER NOT NULL DEFAULT 5,
  inclusions TEXT[] NOT NULL
);

CREATE TABLE tour_slots (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES tour_templates(id),
  date TIMESTAMPTZ NOT NULL,
  guide_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 14,
  current_capacity INTEGER NOT NULL DEFAULT 0,
  status slot_status NOT NULL DEFAULT 'SCHEDULED'
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES tour_slots(id),
  customer_id TEXT NOT NULL,
  passenger_count INTEGER NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  pickup_location JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  special_requirements TEXT,
  guest_info JSONB,
  hold_expires_at TIMESTAMPTZ
);

CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'AVAILABLE',
  license_plate TEXT NOT NULL
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action audit_action NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  details TEXT NOT NULL,
  user_id TEXT NOT NULL
);

-- ─── Realtime Handshake Setup ─────────────────────────────────────
-- Enable the bookings table to broadcast Postgres Changes
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
