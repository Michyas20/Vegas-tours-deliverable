'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useVegasStore } from '@/lib/useVegasStore';
import {
  ScanLine, CheckCircle, AlertTriangle, Users,
  MapPin, Calendar, Clock, CreditCard, ArrowLeft,
} from 'lucide-react';

// Dynamic import — html5-qrcode uses browser APIs
const QRScanner = dynamic(() => import('@/components/guide/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="vh-guide-loading">
      <ScanLine size={48} />
      <p>Loading scanner...</p>
    </div>
  ),
});

type ScanState = 'scanning' | 'found' | 'not-found';

export default function GuideScanPage() {
  const store = useVegasStore();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedBookingId, setScannedBookingId] = useState<string | null>(null);

  const handleScan = useCallback((decodedText: string) => {
    const booking = store.bookings.find((b) => b.id === decodedText);
    setScannedBookingId(decodedText);
    setScanState(booking ? 'found' : 'not-found');
  }, [store.bookings]);

  const handleReset = () => {
    setScanState('scanning');
    setScannedBookingId(null);
  };

  const booking = scannedBookingId
    ? store.bookings.find((b) => b.id === scannedBookingId)
    : null;
  const slot = booking ? store.slots.find((s) => s.id === booking.slotId) : null;
  const template = slot ? store.templates.find((t) => t.id === slot.templateId) : null;

  const statusColor = booking
    ? booking.paymentStatus === 'FULLY_PAID'
      ? '#10b981'
      : booking.paymentStatus === 'DEPOSIT_PAID'
      ? '#f59e0b'
      : booking.paymentStatus === 'CANCELLED'
      ? '#ef4444'
      : '#6b7280'
    : '#6b7280';

  return (
    <div className="vh-guide-page">
      <div className="vh-guide-header">
        <a href="/" className="vh-guide-back">
          <ArrowLeft size={20} />
        </a>
        <div>
          <h1>Guide Check-In</h1>
          <p>Scan a guest&apos;s QR boarding pass</p>
        </div>
        <ScanLine size={28} />
      </div>

      {scanState === 'scanning' && (
        <div className="vh-guide-scanner-area">
          <QRScanner onScan={handleScan} />
          <p className="vh-guide-hint">
            Point camera at the QR code on the guest&apos;s boarding pass
          </p>
        </div>
      )}

      {scanState === 'not-found' && (
        <div className="vh-guide-result vh-guide-error">
          <AlertTriangle size={48} color="#ef4444" />
          <h2>Booking Not Found</h2>
          <p>No booking matches code: <code>{scannedBookingId}</code></p>
          <button className="vh-guide-action-btn" onClick={handleReset}>
            Scan Again
          </button>
        </div>
      )}

      {scanState === 'found' && booking && (
        <div className="vh-guide-result">
          {/* Status header */}
          <div className="vh-guide-status" style={{ borderColor: statusColor }}>
            <CheckCircle size={24} color={statusColor} />
            <div>
              <span className="vh-guide-status-label" style={{ color: statusColor }}>
                {booking.paymentStatus.replace('_', ' ')}
              </span>
              <span className="vh-guide-status-sub">
                ${booking.amountPaid.toFixed(2)} / ${booking.totalAmount.toFixed(2)} paid
              </span>
            </div>
          </div>

          {/* Guest info */}
          <div className="vh-guide-card">
            <h3>{booking.guestInfo?.fullName || booking.customerId}</h3>
            {booking.guestInfo?.email && (
              <p className="vh-guide-card-sub">{booking.guestInfo.email}</p>
            )}
            {booking.guestInfo?.phone && (
              <p className="vh-guide-card-sub">{booking.guestInfo.phone}</p>
            )}
          </div>

          {/* Tour + booking details */}
          <div className="vh-guide-details">
            <div className="vh-guide-detail-row">
              <Calendar size={16} />
              <span>{template?.title || 'Tour'}</span>
            </div>
            <div className="vh-guide-detail-row">
              <Clock size={16} />
              <span>{slot ? new Date(slot.date).toLocaleDateString() : 'N/A'} · {template?.durationHours}h</span>
            </div>
            <div className="vh-guide-detail-row">
              <Users size={16} />
              <span>{booking.passengerCount} passenger{booking.passengerCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="vh-guide-detail-row">
              <MapPin size={16} />
              <span>{booking.pickupLocation.hotelName} · {booking.pickupLocation.address}</span>
            </div>
            <div className="vh-guide-detail-row">
              <CreditCard size={16} />
              <span>Ref: {booking.id.toUpperCase()}</span>
            </div>
          </div>

          <button className="vh-guide-action-btn" onClick={handleReset}>
            Scan Next Guest
          </button>
        </div>
      )}
    </div>
  );
}
