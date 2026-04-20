'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import ExplorerNavbar from '@/components/luxury-ui/ExplorerNavbar';
import ExplorerFooter from '@/components/luxury-ui/ExplorerFooter';
import BookingCard from '@/components/luxury-ui/BookingCard';
import { Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MyBookingsPage() {
  const store = useVegasStore();

  // Demo: show bookings for explorer-01
  const myBookings = store.getBookingsForCustomer('usr-explorer-01');

  return (
    <>
      <ExplorerNavbar />

      {/* Hero */}
      <header
        className="vh-page-hero"
        style={{ backgroundImage: "url('/assets/hero.png')", height: '40vh', paddingTop: 36 }}
      >
        <h1>My Bookings</h1>
      </header>

      {/* Content */}
      <section style={{ padding: '4rem 2rem', background: 'var(--vh-bg-light)', minHeight: '50vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {myBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
              <Ticket size={64} color="#ccc" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ color: 'var(--vh-primary)', marginBottom: '1rem' }}>No Bookings Yet</h2>
              <p style={{ color: '#888', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                You haven&apos;t booked any adventures yet. Explore our tours and find your perfect Vegas escape.
              </p>
              <Link href="/explore/tours" className="vh-primary-btn" style={{ textDecoration: 'none' }}>
                Browse Tours <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                {myBookings.length} booking{myBookings.length !== 1 ? 's' : ''} found for Alex Rivera
              </p>
              {myBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ExplorerFooter />
    </>
  );
}
