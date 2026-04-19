'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import ExplorerNavbar from '@/components/luxury-ui/ExplorerNavbar';
import ExplorerFooter from '@/components/luxury-ui/ExplorerFooter';
import { Clock, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ─── Image mapping ────────────────────────────────────────────────── */

const IMAGES = ['/assets/hero.png', '/assets/hoover.png', '/assets/valley.png'];

/* ─── Component ────────────────────────────────────────────────────── */

export default function TourDetailPage() {
  const params = useParams();
  const templateId = params.slug as string;
  const { templates, slots } = useVegasStore();

  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    return (
      <>
        <ExplorerNavbar />
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem' }}>Tour Not Found</h1>
            <Link href="/explore/tours" className="vh-primary-btn" style={{ textDecoration: 'none' }}>
              Browse All Tours
            </Link>
          </div>
        </div>
        <ExplorerFooter />
      </>
    );
  }

  const templateIdx = templates.indexOf(template);
  const mainImage = IMAGES[templateIdx % IMAGES.length];
  const tourSlots = slots.filter((s) => s.templateId === template.id && s.status === 'SCHEDULED');

  // Build a synthetic itinerary timeline from the template stops
  const itinerary = template.itinerary.map((stop, i) => {
    const hour = 6 + Math.floor((i * template.durationHours) / template.itinerary.length);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return {
      time: `${String(displayHour).padStart(2, '0')}:00 ${ampm}`,
      title: stop,
      details: i === 0 ? 'Departure from your Las Vegas hotel.' : i === template.itinerary.length - 1 ? 'Return to Las Vegas.' : `Guided exploration of ${stop}.`,
    };
  });

  return (
    <>
      <ExplorerNavbar />

      {/* Hero */}
      <header
        className="vh-page-hero"
        style={{ height: '60vh', backgroundImage: `url(${mainImage})`, paddingTop: 36 }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(to top, rgba(10,25,47,0.9), transparent)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 2rem' }}>
          <h1 style={{ fontSize: '3.5rem' }}>{template.title}</h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '1rem auto 0', color: '#f0f0f0' }}>
            {template.description.substring(0, 150)}…
          </p>
        </div>
      </header>

      {/* Detail Content */}
      <div className="vh-tour-detail-container">
        <div className="vh-tour-detail-grid">

          {/* LEFT: Main Info */}
          <div className="vh-tour-main-content">

            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>About This Tour</h2>
              <p>{template.description}</p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h3>What&apos;s Included</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {template.inclusions.map((item, idx) => (
                  <li key={idx} className="vh-highlight-item">
                    <CheckCircle size={20} color="var(--vh-accent)" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h3>Itinerary</h3>
              <div className="vh-itinerary-timeline">
                {itinerary.map((step, idx) => (
                  <div key={idx} className="vh-itinerary-step">
                    <div className="time">{step.time}</div>
                    <h4>{step.title}</h4>
                    <p>{step.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Tour Info</h3>
              <div style={{ background: 'var(--vh-bg-light)', padding: '1.5rem', borderRadius: '8px' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Duration:</strong> {template.durationHours} hours
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Min Age:</strong> {template.minAge} years
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Stops:</strong> {template.itinerary.join(' → ')}
                </p>
                <p>
                  <strong>Available Slots:</strong> {tourSlots.length} upcoming date{tourSlots.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Sticky Booking Panel */}
          <div className="vh-sticky-panel">

            <div className="vh-booking-panel">
              <div className="vh-booking-price">
                ${template.basePricePerPerson}{' '}
                <span>/ adult</span>
              </div>

              <div className="vh-booking-meta">
                <div className="vh-booking-meta-item">
                  <Clock size={20} color="var(--vh-accent)" />
                  <span>{template.durationHours} Hours Duration</span>
                </div>
                <div className="vh-booking-meta-item">
                  <MapPin size={20} color="var(--vh-accent)" />
                  <span>{template.itinerary[template.itinerary.length - 1]}</span>
                </div>
              </div>

              <Link
                href="/explore/tours"
                className="vh-primary-btn pulse"
                style={{
                  width: '100%', padding: '1.2rem', fontSize: '1.2rem',
                  textDecoration: 'none', textAlign: 'center', justifyContent: 'center',
                }}
              >
                Check Availability
              </Link>
              <p style={{ textAlign: 'center', margin: '1rem 0 0', fontSize: '0.85rem', color: '#aaa' }}>
                No payment required to check dates
              </p>
            </div>

            <div className="vh-guide-note">
              <h4>💡 Guide&apos;s Note</h4>
              <p>
                Temperatures can vary significantly from Las Vegas. We recommend
                dressing in layers and bringing a light jacket. Don&apos;t forget
                sunscreen and sunglasses!
              </p>
            </div>
          </div>

        </div>

        {/* Bottom nav */}
        <div style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '4rem' }}>
          <Link
            href="/explore/tours"
            className="vh-ghost-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={20} /> Back to All Tours
          </Link>
        </div>
      </div>

      {/* Photo Strip */}
      <div className="vh-image-strip">
        {IMAGES.map((img, idx) => (
          <div key={idx} style={{ backgroundImage: `url(${img})` }} />
        ))}
      </div>

      <ExplorerFooter />
    </>
  );
}
