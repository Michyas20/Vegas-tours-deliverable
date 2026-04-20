'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin, Clock, Users, Calendar, CheckCircle,
  Loader2, AlertTriangle, Plane,
} from 'lucide-react';

export default function BoardingPassPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const store = useVegasStore();

  const booking = store.bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <div className="vh-bp-wrapper">
        <div className="vh-bp-error">
          <AlertTriangle size={48} color="#f59e0b" />
          <h2>Booking Not Found</h2>
          <p>We couldn&apos;t find a booking with ID <code>{bookingId}</code>.</p>
          <a href="/explore/tours" className="vh-primary-btn" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
            Browse Tours
          </a>
        </div>
      </div>
    );
  }

  const slot = store.slots.find((s) => s.id === booking.slotId);
  const template = slot ? store.templates.find((t) => t.id === slot.templateId) : null;

  const isVerified = booking.paymentStatus !== 'PENDING';
  const isCancelled = booking.paymentStatus === 'CANCELLED';
  const guestName = booking.guestInfo?.fullName || 'Guest';
  const tourDate = slot ? new Date(slot.date) : new Date();

  return (
    <div className="vh-bp-wrapper">
      <div className="vh-bp-ticket" id="boarding-pass">
        {/* ── Top Banner ── */}
        <div className="vh-bp-banner">
          <div className="vh-bp-logo">
            <Plane size={24} />
            <span>Vegas Horizon</span>
          </div>
          <div className="vh-bp-type">BOARDING PASS</div>
        </div>

        {/* ── Verification Badge ── */}
        <div className={`vh-bp-badge ${isVerified ? 'vh-bp-verified' : 'vh-bp-pending'} ${isCancelled ? 'vh-bp-cancelled' : ''}`}>
          {isCancelled ? (
            <><AlertTriangle size={16} /> Cancelled</>
          ) : isVerified ? (
            <><CheckCircle size={16} /> Payment Verified</>
          ) : (
            <><Loader2 size={16} className="vh-spin" /> Awaiting Payment</>
          )}
        </div>

        {/* ── Tour Info ── */}
        <div className="vh-bp-tour-name">
          <h1>{template?.title || 'Tour'}</h1>
          <p>{template?.description?.substring(0, 100)}...</p>
        </div>

        {/* ── Details Grid ── */}
        <div className="vh-bp-details">
          <div className="vh-bp-detail">
            <Calendar size={18} />
            <div>
              <span className="vh-bp-detail-label">Date</span>
              <span className="vh-bp-detail-value">
                {tourDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="vh-bp-detail">
            <Clock size={18} />
            <div>
              <span className="vh-bp-detail-label">Duration</span>
              <span className="vh-bp-detail-value">{template?.durationHours || 0} Hours</span>
            </div>
          </div>

          <div className="vh-bp-detail">
            <Users size={18} />
            <div>
              <span className="vh-bp-detail-label">Passengers</span>
              <span className="vh-bp-detail-value">{booking.passengerCount} Guest{booking.passengerCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="vh-bp-detail">
            <MapPin size={18} />
            <div>
              <span className="vh-bp-detail-label">Pickup</span>
              <span className="vh-bp-detail-value">{booking.pickupLocation.hotelName}</span>
            </div>
          </div>
        </div>

        {/* ── Tearline ── */}
        <div className="vh-bp-tearline">
          <div className="vh-bp-circle vh-bp-circle-left" />
          <div className="vh-bp-dashes" />
          <div className="vh-bp-circle vh-bp-circle-right" />
        </div>

        {/* ── QR Section ── */}
        <div className="vh-bp-qr-section">
          <div className="vh-bp-guest-info">
            <span className="vh-bp-detail-label">Guest Name</span>
            <span className="vh-bp-guest-name">{guestName}</span>
            {booking.guestInfo?.email && (
              <span className="vh-bp-guest-email">{booking.guestInfo.email}</span>
            )}
            <span className="vh-bp-detail-label" style={{ marginTop: '1rem' }}>Booking Reference</span>
            <span className="vh-bp-ref-code">{booking.id.toUpperCase()}</span>
          </div>

          <div className="vh-bp-qr">
            <QRCodeSVG
              value={booking.id}
              size={140}
              level="H"
              bgColor="transparent"
              fgColor="#0A192F"
              style={{ padding: '8px', background: 'white', borderRadius: '12px' }}
            />
            <span className="vh-bp-qr-label">Scan for check-in</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="vh-bp-footer">
          <p>
            {isVerified
              ? '✅ You\'re all set! Show this pass to your guide on tour day.'
              : '⏳ Complete your payment via Zelle/Venmo to confirm this booking.'}
          </p>
          <span className="vh-bp-amount">
            Total: ${booking.totalAmount.toFixed(2)} | Paid: ${booking.amountPaid.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Print Button ── */}
      <button
        className="vh-bp-print-btn"
        onClick={() => window.print()}
      >
        🖨️ Print Boarding Pass
      </button>
    </div>
  );
}
