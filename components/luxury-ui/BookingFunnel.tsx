'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, CreditCard, CheckCircle, ChevronDown,
  AlertCircle, Loader2, Minus, Plus,
} from 'lucide-react';
import { useVegasStore, BookingError } from '@/lib/useVegasStore';
import { validatePickup } from '@/lib/engines/geo.validator';
import { calculatePayment } from '@/lib/engines/payment.engine';
import { useToast } from '@/components/luxury-ui/ToastProvider';
import type { TourTemplate, TourSlot, GeoVerdict, PaymentBreakdown } from '@/types';

/* ─── Preset Hotels ────────────────────────────────────────────────── */

const STRIP_HOTELS = [
  { name: 'Bellagio', address: '3600 S Las Vegas Blvd', lat: 36.1129, lng: -115.1765 },
  { name: 'MGM Grand', address: '3799 S Las Vegas Blvd', lat: 36.1024, lng: -115.1695 },
  { name: 'Caesars Palace', address: '3570 S Las Vegas Blvd', lat: 36.1162, lng: -115.1745 },
  { name: 'Wynn Las Vegas', address: '3131 S Las Vegas Blvd', lat: 36.1265, lng: -115.1625 },
  { name: 'The Venetian', address: '3355 S Las Vegas Blvd', lat: 36.1212, lng: -115.1696 },
  { name: 'Aria Resort', address: '3730 S Las Vegas Blvd', lat: 36.1072, lng: -115.1730 },
  { name: 'Cosmopolitan', address: '3708 S Las Vegas Blvd', lat: 36.1098, lng: -115.1743 },
  { name: 'Other (Custom)', address: '', lat: 0, lng: 0 },
];

/* ─── Props ────────────────────────────────────────────────────────── */

interface BookingFunnelProps {
  template: TourTemplate;
  availableSlots: TourSlot[];
}

/* ─── Component ────────────────────────────────────────────────────── */

export default function BookingFunnel({ template, availableSlots }: BookingFunnelProps) {
  const store = useVegasStore();
  const { addToast } = useToast();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ bookingId: string; payment: PaymentBreakdown } | null>(null);

  // Step 1 state
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  // Step 2 state
  const [selectedHotelIdx, setSelectedHotelIdx] = useState(-1);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [geoVerdict, setGeoVerdict] = useState<GeoVerdict | null>(null);
  const [geoValidating, setGeoValidating] = useState(false);

  // Derived
  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);
  const remainingCapacity = selectedSlot ? selectedSlot.maxCapacity - selectedSlot.currentCapacity : 0;
  const isOverCapacity = selectedSlot ? passengerCount > remainingCapacity : false;

  // Payment preview
  const paymentPreview = useMemo(() => {
    if (!selectedSlot) return null;
    return calculatePayment(
      template.basePricePerPerson,
      passengerCount,
      store.mockDateISO,
      selectedSlot.date
    );
  }, [selectedSlot, passengerCount, template.basePricePerPerson, store.mockDateISO]);

  // ── Geo Validation ──
  const handleHotelSelect = (idx: number) => {
    setSelectedHotelIdx(idx);
    const hotel = STRIP_HOTELS[idx];

    if (hotel.name === 'Other (Custom)') {
      setGeoVerdict(null);
      return;
    }

    setGeoValidating(true);
    // Simulate network delay for UX polish
    setTimeout(() => {
      const verdict = validatePickup({ lat: hotel.lat, lng: hotel.lng });
      setGeoVerdict(verdict);
      setGeoValidating(false);
    }, 600);
  };

  const handleCustomValidate = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) {
      addToast('Please enter valid coordinates', 'warning');
      return;
    }
    setGeoValidating(true);
    setTimeout(() => {
      const verdict = validatePickup({ lat, lng });
      setGeoVerdict(verdict);
      setGeoValidating(false);
    }, 600);
  };

  // ── Booking Submit ──
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !geoVerdict?.withinRadius) return;

    setIsSubmitting(true);
    const hotel = STRIP_HOTELS[selectedHotelIdx];
    const isCustom = hotel.name === 'Other (Custom)';

    try {
      const result = store.createBooking({
        slotId: selectedSlotId,
        customerId: 'usr-explorer-01', // Demo user
        passengerCount,
        pickupLocation: {
          hotelName: isCustom ? 'Custom Location' : hotel.name,
          address: isCustom ? `${customLat}, ${customLng}` : hotel.address,
          coordinates: isCustom
            ? { lat: parseFloat(customLat), lng: parseFloat(customLng) }
            : { lat: hotel.lat, lng: hotel.lng },
        },
      });

      setBookingResult(result);
      setCurrentStep(4); // Success state
      addToast(`Booking confirmed! ID: ${result.bookingId}`, 'success');
    } catch (err) {
      if (err instanceof BookingError) {
        addToast(err.message, 'error');
      } else {
        addToast('An unexpected error occurred', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step validation ──
  const canProceedStep1 = selectedSlotId && passengerCount > 0 && !isOverCapacity;
  const canProceedStep2 = geoVerdict?.withinRadius === true;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  // Success state
  if (currentStep === 4 && bookingResult) {
    return (
      <div className="vh-booking-funnel">
        <div className="vh-booking-success">
          <div className="vh-success-icon">
            <CheckCircle size={48} />
          </div>
          <h3>Booking Confirmed!</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Your adventure is booked. Check &quot;My Bookings&quot; for details.
          </p>
          <div className="vh-reference-box">
            <small style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>Reference</small>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--vh-primary)', letterSpacing: '2px', marginTop: '0.5rem' }}>
              {bookingResult.bookingId.toUpperCase()}
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#555' }}>
            <p><strong>Total:</strong> ${bookingResult.payment.totalAmount.toFixed(2)}</p>
            <p><strong>Deposit Due:</strong> ${bookingResult.payment.depositRequired.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-booking-funnel">
      <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--vh-accent)' }}>
        Book This Tour
      </h3>

      {/* ══════════════ STEP 1: Date & Party Size ══════════════ */}
      <div className={`vh-step ${currentStep === 1 ? 'vh-step-active' : currentStep > 1 ? 'vh-step-complete' : ''}`}>
        <button
          className="vh-step-header"
          onClick={() => currentStep > 1 && setCurrentStep(1)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentStep > 1 ? <CheckCircle size={20} color="#10b981" /> : <Users size={20} />}
            <span>1. Date & Party Size</span>
          </div>
          <ChevronDown size={18} style={{ transform: currentStep === 1 ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
        </button>

        <AnimatePresence>
          {currentStep === 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="vh-step-body">
                {/* Slot selector */}
                <label className="vh-label">Select Date</label>
                <select
                  className="vh-select"
                  value={selectedSlotId}
                  onChange={(e) => { setSelectedSlotId(e.target.value); setPassengerCount(1); }}
                >
                  <option value="">Choose a date...</option>
                  {availableSlots.map((slot) => {
                    const remaining = slot.maxCapacity - slot.currentCapacity;
                    const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    });
                    return (
                      <option key={slot.id} value={slot.id} disabled={remaining <= 0}>
                        {dateStr} — {remaining} seat{remaining !== 1 ? 's' : ''} left
                      </option>
                    );
                  })}
                </select>

                {/* Passenger counter */}
                {selectedSlot && (
                  <>
                    <label className="vh-label" style={{ marginTop: '1rem' }}>Passengers</label>
                    <div className="vh-pax-counter">
                      <button
                        className="vh-pax-btn"
                        onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                        disabled={passengerCount <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="vh-pax-count">{passengerCount}</span>
                      <button
                        className="vh-pax-btn"
                        onClick={() => setPassengerCount(passengerCount + 1)}
                        disabled={passengerCount >= remainingCapacity}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Capacity bar */}
                    <div className="vh-capacity-indicator">
                      <div className="vh-capacity-bar-bg">
                        <div
                          className="vh-capacity-bar-fill"
                          style={{
                            width: `${((selectedSlot.currentCapacity + passengerCount) / selectedSlot.maxCapacity) * 100}%`,
                            background: isOverCapacity ? '#ef4444' : (selectedSlot.currentCapacity + passengerCount) / selectedSlot.maxCapacity > 0.85 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                      <span className="vh-capacity-text">
                        {selectedSlot.currentCapacity + passengerCount}/{selectedSlot.maxCapacity} seats
                        {isOverCapacity && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>• Over capacity!</span>}
                      </span>
                    </div>

                    {/* Price preview */}
                    <div className="vh-price-preview">
                      ${template.basePricePerPerson} × {passengerCount} = <strong>${template.basePricePerPerson * passengerCount}</strong>
                    </div>
                  </>
                )}

                <button
                  className="vh-primary-btn"
                  style={{ width: '100%', marginTop: '1rem', opacity: canProceedStep1 ? 1 : 0.5 }}
                  disabled={!canProceedStep1}
                  onClick={() => setCurrentStep(2)}
                >
                  Continue to Pickup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════ STEP 2: Pickup Location ══════════════ */}
      <div className={`vh-step ${currentStep === 2 ? 'vh-step-active' : currentStep > 2 ? 'vh-step-complete' : ''}`}>
        <button
          className="vh-step-header"
          onClick={() => currentStep > 2 && setCurrentStep(2)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentStep > 2 ? <CheckCircle size={20} color="#10b981" /> : <MapPin size={20} />}
            <span>2. Pickup Location</span>
          </div>
          <ChevronDown size={18} style={{ transform: currentStep === 2 ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
        </button>

        <AnimatePresence>
          {currentStep === 2 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="vh-step-body">
                <label className="vh-label">Select Your Hotel</label>
                <select
                  className="vh-select"
                  value={selectedHotelIdx}
                  onChange={(e) => handleHotelSelect(Number(e.target.value))}
                >
                  <option value={-1}>Choose hotel...</option>
                  {STRIP_HOTELS.map((hotel, i) => (
                    <option key={i} value={i}>{hotel.name}</option>
                  ))}
                </select>

                {/* Custom coordinates */}
                {selectedHotelIdx >= 0 && STRIP_HOTELS[selectedHotelIdx].name === 'Other (Custom)' && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        className="vh-input"
                        placeholder="Latitude"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                      />
                      <input
                        className="vh-input"
                        placeholder="Longitude"
                        value={customLng}
                        onChange={(e) => setCustomLng(e.target.value)}
                      />
                    </div>
                    <button className="vh-ghost-btn" style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }} onClick={handleCustomValidate}>
                      Validate Location
                    </button>
                  </div>
                )}

                {/* Geo verdict badge */}
                {geoValidating && (
                  <div className="vh-geo-badge vh-geo-validating">
                    <Loader2 size={16} className="vh-spin" /> Validating pickup zone...
                  </div>
                )}
                {!geoValidating && geoVerdict && (
                  <div className={`vh-geo-badge ${geoVerdict.withinRadius ? 'vh-geo-pass' : 'vh-geo-fail'}`}>
                    {geoVerdict.withinRadius ? (
                      <><CheckCircle size={16} /> Within Zone — {geoVerdict.distanceMiles}mi from Strip</>
                    ) : (
                      <><AlertCircle size={16} /> Outside Zone — {geoVerdict.distanceMiles}mi (max: {geoVerdict.maxRadiusMiles}mi)</>
                    )}
                  </div>
                )}

                <button
                  className="vh-primary-btn"
                  style={{ width: '100%', marginTop: '1rem', opacity: canProceedStep2 ? 1 : 0.5 }}
                  disabled={!canProceedStep2}
                  onClick={() => setCurrentStep(3)}
                >
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════ STEP 3: Payment Summary ══════════════ */}
      <div className={`vh-step ${currentStep === 3 ? 'vh-step-active' : ''}`}>
        <button className="vh-step-header" onClick={() => {}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} />
            <span>3. Payment Summary</span>
          </div>
          <ChevronDown size={18} style={{ transform: currentStep === 3 ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
        </button>

        <AnimatePresence>
          {currentStep === 3 && paymentPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="vh-step-body">
                <div className="vh-payment-summary">
                  <div className="vh-payment-row">
                    <span>Price per person</span>
                    <span>${paymentPreview.pricePerPerson}</span>
                  </div>
                  <div className="vh-payment-row">
                    <span>Passengers</span>
                    <span>× {paymentPreview.passengerCount}</span>
                  </div>
                  <div className="vh-payment-divider" />
                  <div className="vh-payment-row vh-payment-total">
                    <span>Total</span>
                    <span>${paymentPreview.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="vh-payment-divider" />

                  {/* Deposit vs Full */}
                  <div className={`vh-payment-deposit ${paymentPreview.isFullPaymentRequired ? 'vh-full-pay' : 'vh-deposit-pay'}`}>
                    {paymentPreview.isFullPaymentRequired ? (
                      <>
                        <div className="vh-deposit-label">💳 Full Payment Required</div>
                        <div className="vh-deposit-reason">Tour departs in {paymentPreview.daysUntilTour} day{paymentPreview.daysUntilTour !== 1 ? 's' : ''} (within 10-day window)</div>
                        <div className="vh-deposit-amount">${paymentPreview.totalAmount.toFixed(2)} due now</div>
                      </>
                    ) : (
                      <>
                        <div className="vh-deposit-label">💰 20% Deposit</div>
                        <div className="vh-deposit-reason">Tour is {paymentPreview.daysUntilTour} days away — only a deposit required today</div>
                        <div className="vh-deposit-amount">${paymentPreview.depositRequired.toFixed(2)} due now</div>
                        <div className="vh-deposit-remaining">Remaining ${(paymentPreview.totalAmount - paymentPreview.depositRequired).toFixed(2)} due before tour date</div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  className="vh-primary-btn pulse"
                  style={{ width: '100%', marginTop: '1rem', fontSize: '1.05rem' }}
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="vh-spin" /> Processing...</>
                  ) : (
                    `Confirm & Pay $${paymentPreview.depositRequired.toFixed(2)}`
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '0.75rem' }}>
                  Secure checkout • Free cancellation 48h+ before tour
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
