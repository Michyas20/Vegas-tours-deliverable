import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 1. Load Environment Variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or Service Key in .env.local');
  process.exit(1);
}

// Ensure we use the Service Role Key to bypass RLS for migration
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Starting LocalStorage -> Supabase Migration...');

  // 2. Load the exported local state
  // Instructions: The user must copy the value of `vegas-tours-store` from
  // browser Developer Tools -> Application -> Local Storage and save it as `local-state.json`
  const statePath = path.resolve(__dirname, '../local-state.json');
  
  if (!fs.existsSync(statePath)) {
    console.error('❌ local-state.json not found!');
    console.error('Please export your localStorage state to local-state.json in the project root.');
    process.exit(1);
  }

  const rawState = fs.readFileSync(statePath, 'utf8');
  let state;
  try {
    const parsed = JSON.parse(rawState);
    state = parsed.state; // Zustand persist wrapper places it under `state`
  } catch (err) {
    console.error('❌ Invalid JSON in local-state.json');
    process.exit(1);
  }

  const { templates = [], slots = [], bookings = [] } = state;

  console.log(`📦 Found ${templates.length} templates, ${slots.length} slots, ${bookings.length} bookings.`);

  // 3. Migrate Tour Templates
  if (templates.length > 0) {
    const mappedTemplates = templates.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      itinerary: t.itinerary,
      duration_hours: t.durationHours,
      base_price_per_person: t.basePricePerPerson,
      min_age: t.minAge || 5,
      inclusions: t.inclusions || [],
    }));

    const { error } = await supabase.from('tour_templates').upsert(mappedTemplates);
    if (error) console.error('❌ Failed to insert templates:', error.message);
    else console.log('✅ Migrated Templates');
  }

  // 4. Migrate Tour Slots
  if (slots.length > 0) {
    const mappedSlots = slots.map((s: any) => ({
      id: s.id,
      template_id: s.templateId,
      date: s.date,
      guide_id: s.guideId,
      vehicle_id: s.vehicleId,
      max_capacity: s.maxCapacity,
      current_capacity: s.currentCapacity,
      status: s.status,
    }));

    const { error } = await supabase.from('tour_slots').upsert(mappedSlots);
    if (error) console.error('❌ Failed to insert slots:', error.message);
    else console.log('✅ Migrated Slots');
  }

  // 5. Migrate Bookings
  if (bookings.length > 0) {
    const mappedBookings = bookings.map((b: any) => ({
      id: b.id,
      slot_id: b.slotId,
      customer_id: b.customerId,
      passenger_count: b.passengerCount,
      total_amount: b.totalAmount,
      amount_paid: b.amountPaid,
      payment_status: b.paymentStatus,
      pickup_location: b.pickupLocation,
      created_at: b.createdAt,
      special_requirements: b.specialRequirements,
      guest_info: b.guestInfo,
      hold_expires_at: b.holdExpiresAt,
    }));

    const { error } = await supabase.from('bookings').upsert(mappedBookings);
    if (error) console.error('❌ Failed to insert bookings:', error.message);
    else console.log('✅ Migrated Bookings');
  }

  console.log('🎉 Migration Complete!');
}

runMigration();
