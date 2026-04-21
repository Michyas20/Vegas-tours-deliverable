import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { PendingPaymentEmail } from '@/emails/PendingPaymentEmail';
import { PaymentConfirmedEmail } from '@/emails/PaymentConfirmedEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();
    const guestEmail = payload.guestEmail;

    if (!guestEmail) {
      return NextResponse.json({ error: 'Missing guestEmail' }, { status: 400 });
    }

    let subject = '';
    let htmlContent = '';

    if (type === 'pending') {
      subject = 'Action Required: Complete your Vegas Horizon booking';
      htmlContent = PendingPaymentEmail({
        guestName: payload.guestName,
        tourName: payload.tourName,
        totalAmount: payload.totalAmount,
        bookingId: payload.bookingId,
      });
    } else if (type === 'verified') {
      subject = 'Confirmed: Your Vegas Horizon Boarding Pass';
      htmlContent = PaymentConfirmedEmail({
        guestName: payload.guestName,
        tourName: payload.tourName,
        tourDate: payload.tourDate,
        bookingId: payload.bookingId,
      });
    } else {
      return NextResponse.json({ error: 'Invalid email type specified' }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'Vegas Horizon <concierge@vegashorizon.com>',
      to: [guestEmail],
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
