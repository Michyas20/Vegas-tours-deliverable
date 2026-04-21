export interface PaymentConfirmedEmailProps {
  guestName: string;
  tourName: string;
  tourDate: string;
  bookingId: string;
}

export function PaymentConfirmedEmail({
  guestName = 'Valued Guest',
  tourName = 'Vegas Horizon Tour',
  tourDate = 'Select Date',
  bookingId = 'BK-001',
}: PaymentConfirmedEmailProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="background-color: #0a0a0a; font-family: 'Syne', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
      <div style="margin: 0 auto; padding: 40px 20px; width: 100%; max-width: 600px; background-color: #111111; border: 1px solid #333333; border-radius: 12px; box-sizing: border-box;">
        
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 2px;">
            Payment Verified
          </h1>
          <div style="text-align: center;">
            <p style="display: inline-block; padding: 6px 16px; background-color: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 9999px; font-size: 14px; font-weight: bold; letter-spacing: 1px; margin: 0;">
              ✅ CONFIRMED
            </p>
          </div>
        </div>

        <p style="color: #F3F4F6; font-size: 16px; line-height: 26px; margin-bottom: 20px;">
          Hello ${guestName},
        </p>
        
        <p style="color: #F3F4F6; font-size: 16px; line-height: 26px; margin-bottom: 20px;">
          We have successfully received your transfer. Your spot on the <strong>${tourName}</strong> is now 100% locked in and verified! We are incredibly excited to host you.
        </p>

        <div style="background-color: #1c1c1e; padding: 24px; border-radius: 8px; margin-bottom: 32px; border: 1px solid #333333;">
          <p style="color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Tour Name</p>
          <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">${tourName}</p>
          
          <p style="color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Date</p>
          <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">${tourDate}</p>

          <p style="color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Booking Reference</p>
          <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 0;">${bookingId.toUpperCase()}</p>
        </div>

        <p style="color: #F3F4F6; font-size: 16px; line-height: 26px; margin-bottom: 20px;">
          You can access your Digital Boarding Pass at any time, which contains your pickup location, pickup time, and emergency contact details for your guide.
        </p>

        <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
          <a href="http://localhost:3001/confirmation/${bookingId}" style="background-color: #22c55e; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: block; width: 100%; padding: 16px; box-sizing: border-box;">
            View Digital Boarding Pass
          </a>
        </div>

        <p style="color: #9CA3AF; font-size: 14px; line-height: 24px; margin-top: 20px; text-align: center;">
          For any urgent changes to your itinerary, please reply directly to this email. See you soon in the desert!
        </p>

      </div>
    </body>
    </html>
  `;
}
