export interface PendingPaymentEmailProps {
  guestName: string;
  tourName: string;
  totalAmount: number;
  bookingId: string;
}

export function PendingPaymentEmail({
  guestName = 'Valued Guest',
  tourName = 'Vegas Horizon Tour',
  totalAmount = 0,
  bookingId = 'BK-001',
}: PendingPaymentEmailProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="background-color: #0a0a0a; font-family: 'Syne', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
      <div style="margin: 0 auto; padding: 40px 20px; width: 100%; max-width: 600px; background-color: #111111; border: 1px solid #333333; border-radius: 12px; box-sizing: border-box;">
        
        <h1 style="color: #F7C948; font-size: 28px; font-weight: 700; text-align: center; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px;">
          Action Required
        </h1>
        
        <p style="color: #F3F4F6; font-size: 16px; line-height: 26px; margin-bottom: 20px;">
          Hello ${guestName},
        </p>
        
        <p style="color: #F3F4F6; font-size: 16px; line-height: 26px; margin-bottom: 20px;">
          Thank you for holding your spot for the <strong>${tourName}</strong>! Because we operate an exclusive, low-capacity model to ensure the highest quality experience, we do not process credit cards automatically online.
        </p>
        
        <p style="color: #F3F4F6; font-size: 16px; line-height: 26px; margin-bottom: 20px;">
          To fully secure your reservation, please complete your payment of <strong>$${totalAmount.toFixed(2)}</strong> via Zelle or Venmo within the next 24 hours. If we do not receive payment, your spot will be automatically released back to the waitlist.
        </p>

        <div style="background-color: #1c1c1e; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid rgba(247, 201, 72, 0.26);">
          <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px;">Payment Instructions</h2>
          <hr style="border: 0; border-top: 1px solid #333333; margin: 0 0 16px;" />
          
          <p style="color: #ffffff; font-size: 16px; line-height: 1.5; margin: 0 0 12px;">
            <strong>1. Zelle:</strong> payments@vegashorizon.com
          </p>
          <p style="color: #ffffff; font-size: 16px; line-height: 1.5; margin: 0 0 12px;">
            <strong>2. Venmo:</strong> @VegasHorizon
          </p>
          
          <div style="background-color: rgba(247, 201, 72, 0.06); padding: 16px; border-radius: 6px; margin-top: 16px;">
            <p style="color: #F7C948; font-size: 14px; line-height: 1.5; margin: 0 0 8px;">
              <strong>CRITICAL:</strong> Please include your Booking Reference Code as the memo/note in your transfer so we can instantly verify your ticket:
            </p>
            <p style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 4px; text-align: center; margin: 0; padding: 8px 0; background-color: #222222; border-radius: 4px;">
              ${bookingId.toUpperCase()}
            </p>
          </div>
        </div>

        <p style="color: #9CA3AF; font-size: 14px; line-height: 24px; margin-top: 20px;">
          Once your transfer is initiated, our team will instantly verify the transaction and email you your Digital Boarding Pass and pickup details. You can always check the status of your ticket at 
          <a href="https://vegashorizon.com/explore/lookup" style="color: #F7C948; text-decoration: underline;">vegashorizon.com/lookup</a>.
        </p>

      </div>
    </body>
    </html>
  `;
}
