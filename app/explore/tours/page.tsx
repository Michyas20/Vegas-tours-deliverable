'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import ExplorerNavbar from '@/components/luxury-ui/ExplorerNavbar';
import ExplorerFooter from '@/components/luxury-ui/ExplorerFooter';
import Link from 'next/link';

/* ─── Image + badge mapping ────────────────────────────────────────── */

const TOUR_IMAGES = ['/assets/hero.png', '/assets/hoover.png', '/assets/valley.png'];
const TOUR_BADGES: Record<number, { text: string; className: string } | null> = {
  0: { text: 'Best Selling', className: '' },
  1: { text: 'Our Pick', className: 'our-pick' },
  2: { text: 'Most Photogenic', className: 'stunning' },
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function ToursListPage() {
  const { templates } = useVegasStore();

  return (
    <>
      <ExplorerNavbar />

      {/* Hero */}
      <header
        className="vh-page-hero"
        style={{ backgroundImage: "url('/assets/hero.png')", paddingTop: 36 }}
      >
        <h1>All Adventures</h1>
      </header>

      {/* Tour Grid */}
      <section className="vh-tours-section" style={{ background: 'white' }}>
        <div className="vh-section-headers">
          <h2>Find Your Perfect Vegas Escape</h2>
          <p>
            From the majestic depths of the Grand Canyon to the neon rocks of the
            Valley of Fire, our expert guides are ready to take you on an
            unforgettable journey.
          </p>
        </div>

        <div className="vh-tours-grid">
          {templates.map((template, idx) => {
            const image = TOUR_IMAGES[idx % TOUR_IMAGES.length];
            const badge = TOUR_BADGES[idx] ?? null;
            const mainStop =
              template.itinerary[Math.floor(template.itinerary.length / 2)] ||
              template.itinerary[0];

            return (
              <Link
                href={`/explore/tour/${template.id}`}
                key={template.id}
                className="vh-tour-card"
                style={{ textDecoration: 'none' }}
              >
                {badge && (
                  <div className={`vh-card-badge ${badge.className}`}>
                    {badge.text}
                  </div>
                )}
                <div
                  className="vh-card-img"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="vh-card-content">
                  <div className="vh-card-price">
                    From ${template.basePricePerPerson}
                  </div>
                  <h3>{template.title}</h3>
                  <p>{template.description.substring(0, 120)}…</p>
                  <ul className="vh-tour-highlights">
                    <li>📍 {mainStop}</li>
                    <li>⏱️ {template.durationHours} Hours</li>
                  </ul>
                  <span
                    className="vh-primary-btn"
                    style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
                  >
                    Book Now
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <ExplorerFooter />
    </>
  );
}
