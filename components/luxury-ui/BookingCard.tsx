'use client';

import { useMemo } from 'react';
import { Calendar, Users, MapPin, DollarSign, XCircle } from 'lucide-react';
import { useVegasStore, BookingError } from '@/lib/useVegasStore';
import { canCancel } from '@/lib/engines/time.guard';
import { useToast } from '@/components/luxury-ui/ToastProvider';
import type { Booking, TourSlot, TourTemplate, CancellationVerdict } from '@/types';

/* ─── Status Timeline Steps ────────────────────────────────────────── */

const TIMELINE_STEPS = ['Booked', 'Deposit Paid', 'Fully Paid', 'Tour Complete'] as const;

function getActiveStepIdx(booking: Booking, slot: TourSlot | undefined): number {
  if (booking.paymentStatus === 'CANCELLED') return -1; // special case
  if (slot?.status === 'COMPLETED') return 3;
  if (booking.paymentStatus === 'FULLY_PAID') return 2;
  if (booking.paymentStatus === 'DEPOSIT_PAID') return 1;
  return 0; // PENDING
}

/* ─── Props ────────────────────────────────────────────────────────── */

interface BookingCardProps {
  booking: Booking;
}

/* ─── Component ────────────────────────────────────────────────────── */

export default function BookingCard({ booking }: BookingCardProps) {
  const store = useVegasStore();
  const { addToast } = useToast();

  const slot = store.slots.find((s) => s.id === booking.slotId);
  const template = slot ? store.templates.find((t) => t.id === slot.templateId) : undefined;
  const activeStep = getActiveStepIdx(booking, slot);
  const isCancelled = booking.paymentStatus === 'CANCELLED';

  // Check cancellation lockout
  const cancellationVerdict = useMemo<CancellationVerdict | null>(() => {
    if (!slot || isCancelled) return null;
    return canCancel(slot.date, store.mockDateISO);
  }, [slot, store.mockDateISO, isCancelled]);

  const handleCancel = () => {
    if (!cancellationVerdict?.allowed) return;

    const confirmed = window.confirm(
      `Cancel this booking? You will receive a refund for any amount paid.`
    );
    if (!confirmed) return;

    try {
      const result = store.cancelBooking(booking.id);
      if (result.allowed) {
        addToast(
          `Booking cancelled. Refund: $${result.refundAmount?.toFixed(2) || '0.00'}`,
          'success'
        );
      } else {
        addToast(result.reason || 'Cancellation not allowed', 'error');
      }
    } catch (err) {
      if (err instanceof BookingError) {
        addToast(err.message, 'error');
      }
    }
  };

  const tourDate = slot ? new Date(slot.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }) : 'Unknown Date';

  return (
    <div className={`vh-booking-card ${isCancelled ? 'vh-cancelled' : ''}`}>
      {/* Header */}
      <div className="vh-bcard-header">
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
            {template?.title || 'Unknown Tour'}
          </h3>
          <p style={{ margin: '0.3rem 0 0', color: '#888', fontSize: '0.85rem' }}>
            Ref: {booking.id.toUpperCase()}
          </p>
        </div>
        <div className={`vh-bcard-status ${booking.paymentStatus.toLowerCase().replace('_', '-')}`}>
          {booking.paymentStatus.replace('_', ' ')}
        </div>
      </div>

      {/* Details row */}
      <div className="vh-bcard-details">
        <div className="vh-bcard-detail">
          <Calendar size={16} /> {tourDate}
        </div>
        <div className="vh-bcard-detail">
          <Users size={16} /> {booking.passengerCount} passenger{booking.passengerCount !== 1 ? 's' : ''}
        </div>
        <div className="vh-bcard-detail">
          <MapPin size={16} /> {booking.pickupLocation.hotelName}
        </div>
        <div className="vh-bcard-detail">
          <DollarSign size={16} /> ${booking.amountPaid.toFixed(2)} / ${booking.totalAmount.toFixed(2)}
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="vh-status-timeline">
          {TIMELINE_STEPS.map((step, idx) => (
            <div
              key={step}
              className={`vh-timeline-step ${idx <= activeStep ? 'vh-tl-active' : ''} ${idx === activeStep ? 'vh-tl-current' : ''}`}
            >
              <div className="vh-tl-dot" />
              <span className="vh-tl-label">{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel section */}
      {!isCancelled && (
        <div className="vh-bcard-actions">
          {cancellationVerdict && !cancellationVerdict.allowed ? (
            <div className="vh-cancel-locked">
              <XCircle size={14} />
              <span>Cancellation locked — tour within {cancellationVerdict.lockThresholdHours}h ({cancellationVerdict.hoursUntilTour}h remaining)</span>
            </div>
          ) : (
            <button className="vh-cancel-btn" onClick={handleCancel}>
              Cancel Booking
            </button>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="vh-cancelled-badge">
          <XCircle size={16} /> This booking has been cancelled
        </div>
      )}
    </div>
  );
}
