'use client';

import { CheckCircle, Copy, Clock, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PaymentBreakdown } from '@/types';

interface PaymentInstructionsProps {
  bookingId: string;
  payment: PaymentBreakdown;
  guestName: string;
}

export default function PaymentInstructions({
  bookingId,
  payment,
  guestName,
}: PaymentInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2 hours in seconds

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amountDue = payment.isFullPaymentRequired
    ? payment.totalAmount
    : payment.depositRequired;

  return (
    <div className="vh-payment-instructions">
      {/* Success header */}
      <div className="vh-pi-header">
        <CheckCircle size={40} color="#10b981" />
        <h3>Spot Reserved!</h3>
        <p>Hi {guestName}, your spot is held. Complete payment to confirm.</p>
      </div>

      {/* Hold timer */}
      <div className="vh-hold-timer">
        <Clock size={16} />
        <span>Spot held for: <strong>{formatTime(timeLeft)}</strong></span>
      </div>

      {/* Payment amount */}
      <div className="vh-pi-amount">
        <span className="vh-pi-amount-label">
          {payment.isFullPaymentRequired ? 'Full Payment Due' : '20% Deposit Due'}
        </span>
        <span className="vh-pi-amount-value">${amountDue.toFixed(2)}</span>
      </div>

      {/* Payment methods */}
      <div className="vh-pi-methods">
        <h4>Send Payment Via:</h4>

        <div className="vh-pi-method">
          <div className="vh-pi-method-icon" style={{ background: '#6d28d9' }}>Z</div>
          <div className="vh-pi-method-info">
            <strong>Zelle</strong>
            <span>payments@vegashorizon.com</span>
          </div>
          <button
            className="vh-pi-copy"
            onClick={() => handleCopy('payments@vegashorizon.com')}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div className="vh-pi-method">
          <div className="vh-pi-method-icon" style={{ background: '#008CFF' }}>V</div>
          <div className="vh-pi-method-info">
            <strong>Venmo</strong>
            <span>@VegasHorizon</span>
          </div>
          <button
            className="vh-pi-copy"
            onClick={() => handleCopy('@VegasHorizon')}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Reference note */}
      <div className="vh-pi-note">
        <strong>Include this reference in your payment memo:</strong>
        <div className="vh-pi-reference">
          <code>{bookingId.toUpperCase()}</code>
          <button
            className="vh-pi-copy"
            onClick={() => handleCopy(bookingId.toUpperCase())}
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Boarding pass link */}
      <a
        href={`/confirmation/${bookingId}`}
        className="vh-primary-btn"
        style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', textDecoration: 'none' }}
      >
        View Boarding Pass <ArrowRight size={16} />
      </a>

      <p className="vh-pi-footer">
        Your booking will be confirmed once our team verifies payment.
        You&apos;ll see a &quot;Verified&quot; badge on your boarding pass.
      </p>
    </div>
  );
}
