import { test, expect } from '@playwright/test';
import path from 'path';

test('Visual E2E Booking & Verification Human-Mimic', async ({ page }) => {
  // Step 1: Navigates to the explore page
  await page.goto('/explore');
  
  const firstTourCard = page.locator('div.bg-card').first();
  await firstTourCard.waitFor({ state: 'visible' });
  const bookButton = firstTourCard.locator('button', { hasText: 'Book Now' }).first();
  
  if (await bookButton.isVisible()) {
      await bookButton.click();
  } else {
      await page.goto('/explore/lookup');
      await page.click('button:text-is("Book Now")');
  }

  // Handle the modal / booking funnel form
  await page.click('button:text-is("Select Date")').catch(() => {});
  await page.locator('button', { hasText: 'Continue' }).first().click().catch(() => {});
  
  // Passenger count
  await page.locator('button', { hasText: 'Continue' }).first().click().catch(() => {});
  
  // Hotel selector
  await page.locator('select').first().selectOption({ index: 1 }).catch(() => {});
  await page.locator('button', { hasText: 'Continue' }).first().click().catch(() => {});

  // Guest Details
  await page.fill('input[name="fullName"], input[placeholder*="Name"]', 'Automated QA Guest');
  await page.fill('input[type="email"], input[name="email"]', 'qa@vegashorizon.com');
  await page.fill('input[type="tel"], input[name="phone"]', '555-0199');
  
  // Screenshot 1: 01-booking-form.png
  await page.screenshot({ path: path.join(process.cwd(), '01-booking-form.png') });

  // Submit the booking
  await page.locator('button', { hasText: 'Confirm Booking' }).click().catch(async () => {
      await page.locator('button', { hasText: 'Book Now' }).click().catch(() => {});
  });

  // Screenshot 2: 02-pending-boarding-pass.png
  await page.waitForURL(/\/confirmation\/.+/);
  await page.waitForTimeout(2000); // Allow react animations/QR code to visually construct
  
  // Extract booking ID from the URL
  const url = page.url();
  const bookingId = url.split('/').pop()?.toUpperCase();
  expect(bookingId).toBeDefined();

  await page.screenshot({ path: path.join(process.cwd(), '02-pending-boarding-pass.png') });

  // Step 3: Admin Verification
  // The system uses a role switcher, but we can hit the Concierge view directly if the router allows.
  await page.goto('/dashboard').catch(() => {}); 
  
  // Try to push to Verification Hub tab 
  await page.locator('button:text-is("Verification Hub")').click().catch(() => {});
  
  // Screenshot 3: 03-admin-hub-entry.png
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(process.cwd(), '03-admin-hub-entry.png') });

  // The Handshake: Clicks "✅ Verify Payment"
  await page.locator('button', { hasText: '✅ Verify Payment' }).first().click();

  // Wait for the mutation to settle the state
  await page.waitForTimeout(1000);

  // Step 4: The Proof
  await page.goto(`/confirmation/${bookingId}`);
  await page.waitForTimeout(2000); 

  // Screenshot 4: 04-verified-boarding-pass.png
  await page.screenshot({ path: path.join(process.cwd(), '04-verified-boarding-pass.png') });

  // Assertions mapping to UI proof
  const isVerifiedVisible = await page.locator('text=CONFIRMED').first().isVisible();
  expect(isVerifiedVisible).toBeTruthy();
});
