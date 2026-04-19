'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import ExplorerNavbar from '@/components/luxury-ui/ExplorerNavbar';
import ExplorerFooter from '@/components/luxury-ui/ExplorerFooter';
import AnimatedCounter from '@/components/luxury-ui/AnimatedCounter';
import {
  Award,
  Users,
  ShieldCheck,
  Camera,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

/* ─── Static review data (not in store — marketing content) ─────── */

const REVIEWS = [
  {
    title: '"The Best Decision!"',
    text: '"Escaping the strip was incredible. Our guide was hilarious, knowledgeable, and took the most amazing photos of us."',
    name: 'Sarah Jenkins',
    tour: 'Grand Canyon VIP',
    image: '/assets/hero.png',
  },
  {
    title: '"Worth Every Penny"',
    text: '"We didn\'t know what to expect but the Valley of Fire completely blew us away. Unlimited water and snacks was a huge plus!"',
    name: 'Marcus D.',
    tour: 'Valley of Fire',
    image: '/assets/valley.png',
  },
  {
    title: '"Highly Recommend!"',
    text: '"The Hoover dam walk was spectacular. The booking process was super simple, and the pick-up from our hotel was right on time."',
    name: 'The Peterson Family',
    tour: 'Hoover Dam Tour',
    image: '/assets/hoover.png',
  },
];

/* ─── Tour card image mapping (by template index) ───────────────── */

const TOUR_IMAGES = ['/assets/hero.png', '/assets/hoover.png', '/assets/valley.png'];
const TOUR_BADGES: Record<number, { text: string; className: string }> = {
  0: { text: 'Best Selling', className: '' },
  1: { text: 'Our Pick', className: 'our-pick' },
  2: { text: 'Most Photogenic', className: 'stunning' },
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function ExplorePage() {
  const { templates, slots, bookings } = useVegasStore();

  // Show top 3 templates
  const topTemplates = templates.slice(0, 3);

  // Derive dynamic stats from store
  const totalPassengers = slots.reduce((sum, s) => sum + s.currentCapacity, 0);
  const maxGroupSize = 14; // BR-01 cap
  const totalSlots = slots.length;

  return (
    <>
      <ExplorerNavbar />

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════ */}
      <header className="vh-hero" style={{ paddingTop: 36 }}>
        <div className="bg-media">
          <div
            className="ken-burns-img"
            style={{ backgroundImage: "url('/assets/hero.png')" }}
          />
          <div className="overlay" />
        </div>
        <div className="vh-hero-content">
          <h1>
            Unforgettable <br />
            <span className="vh-highlight">Group Tours</span>
          </h1>
          <p>
            Escape the neon lights. Experience the majestic beauty of the Nevada
            desert in comfort and luxury.
          </p>
          <div>
            <Link href="/explore/tours" className="vh-primary-btn pulse">
              Book Your Adventure
            </Link>
            <div className="vh-hero-trust">
              ⭐ 5.0 Rating • 100% Free Cancellation
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES MARQUEE
          ══════════════════════════════════════════════════════════ */}
      <section className="vh-features-banner">
        <div className="vh-features-track">
          {[1, 2].map((set) => (
            <div key={set} style={{ display: 'flex', gap: '2rem' }}>
              <div className="vh-feature-item">
                <div className="vh-feat-icon"><Award size={28} /></div>
                <h3>Award Winning</h3>
                <p className="feat-desc">TripAdvisor Travelers&apos; Choice</p>
              </div>
              <div className="vh-feature-item">
                <div className="vh-feat-icon"><Users size={28} /></div>
                <h3>Group Tours</h3>
                <p className="feat-desc">Max {maxGroupSize} passengers</p>
              </div>
              <div className="vh-feature-item">
                <div className="vh-feat-icon"><ShieldCheck size={28} /></div>
                <h3>Best Price Guarantee</h3>
                <p className="feat-desc">No hidden fees, ever</p>
              </div>
              <div className="vh-feature-item">
                <div className="vh-feat-icon"><Camera size={28} /></div>
                <h3>Pro Guides</h3>
                <p className="feat-desc">We capture your best photos</p>
              </div>
              <div className="vh-feature-item">
                <div className="vh-feat-icon"><CalendarCheck size={28} /></div>
                <h3>Risk Free Booking</h3>
                <p className="feat-desc">Instantly secure your dates</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ABOUT + ANIMATED STATS
          ══════════════════════════════════════════════════════════ */}
      <section className="vh-about-section">
        <div className="vh-about-grid">
          {/* Left: text */}
          <div>
            <p
              style={{
                color: 'var(--vh-accent)',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: '1.5rem',
                fontFamily: 'var(--font-syne)',
              }}
            >
              About Vegas Horizon
            </p>
            <h2
              style={{
                color: 'white',
                fontSize: '3rem',
                lineHeight: 1.2,
                marginBottom: '2rem',
              }}
            >
              We Don&apos;t Just Drive You.
              <br />
              We{' '}
              <em style={{ color: 'var(--vh-accent)', fontStyle: 'normal' }}>
                Guide
              </em>{' '}
              You.
            </h2>
            <p
              style={{
                color: '#aaa',
                fontSize: '1.05rem',
                lineHeight: 1.9,
                marginBottom: '2.5rem',
              }}
            >
              After a decade of small-group desert adventures, we&apos;ve perfected
              what it means to combine comfort, education, and adventure into a
              single unforgettable day. Our Las Vegas-born guides have walked
              every canyon trail and know every hidden viewpoint — so you
              don&apos;t have to guess.
            </p>
            <Link
              href="/explore/tours"
              className="vh-ghost-btn"
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Explore All Tours →
            </Link>
          </div>

          {/* Right: animated stats — sourced from store */}
          <div className="vh-stats-grid">
            {[
              { end: Math.max(totalPassengers * 100, 10000), suffix: '+', label: 'Happy Guests' },
              { end: maxGroupSize, suffix: '', label: 'Max Group Size' },
              { end: 5, suffix: '★', label: 'Star Rating' },
              { end: 100, suffix: '%', label: 'Local Guides' },
            ].map((stat) => (
              <div key={stat.label} className="vh-stat-card">
                <div className="vh-stat-value">
                  <AnimatedCounter endValue={stat.end} suffix={stat.suffix} />
                </div>
                <div className="vh-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TOUR CARDS — FROM ZUSTAND STORE
          ══════════════════════════════════════════════════════════ */}
      <section className="vh-tours-section">
        <div className="vh-section-headers">
          <h2>Our Top Rated Tours</h2>
          <p>Explore the wonders around Las Vegas with our expert guides</p>
        </div>

        <div className="vh-tours-grid">
          {topTemplates.map((template, idx) => {
            const image = TOUR_IMAGES[idx % TOUR_IMAGES.length];
            const badge = TOUR_BADGES[idx];
            const mainStop = template.itinerary[Math.floor(template.itinerary.length / 2)] || template.itinerary[0];

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
                  <span className="vh-ghost-btn" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                    Book Now
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/explore/tours" className="vh-primary-btn">
            Explore All Tours <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          REVIEWS MARQUEE
          ══════════════════════════════════════════════════════════ */}
      <section className="vh-reviews-section">
        <div className="vh-section-headers" style={{ padding: '0 2rem' }}>
          <h2>What Our Travelers Say</h2>
          <p>Real stories from our amazing guests.</p>
        </div>

        <div className="vh-reviews-wrapper">
          <div className="vh-reviews-track">
            {[1, 2].map((set) => (
              <div key={`review-set-${set}`} style={{ display: 'flex', gap: '2rem' }}>
                {REVIEWS.map((review, i) => (
                  <div key={`${set}-${i}`} className="vh-review-card">
                    <div className="vh-review-stars">⭐⭐⭐⭐⭐</div>
                    <h4>{review.title}</h4>
                    <p>{review.text}</p>
                    <div className="vh-reviewer-info">
                      <div
                        className="vh-reviewer-avatar"
                        style={{ backgroundImage: `url(${review.image})` }}
                      />
                      <div>
                        <strong>{review.name}</strong>
                        <span
                          style={{
                            display: 'block',
                            color: '#888',
                            fontSize: '0.80rem',
                          }}
                        >
                          {review.tour}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GALLERY PREVIEW
          ══════════════════════════════════════════════════════════ */}
      <section className="vh-gallery-preview">
        <div className="vh-section-headers">
          <h2>Captured Moments</h2>
          <p>Real memories from our amazing guests</p>
        </div>
        <div className="vh-gallery-grid-preview">
          <div className="vh-preview-img" style={{ backgroundImage: "url('/assets/hero.png')" }} />
          <div className="vh-preview-img" style={{ backgroundImage: "url('/assets/valley.png')" }} />
          <div className="vh-preview-img" style={{ backgroundImage: "url('/assets/hoover.png')" }} />
          <div className="vh-preview-img" style={{ backgroundImage: "url('/assets/hero.png')" }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link href="/explore/tours" className="vh-primary-btn" style={{ textDecoration: 'none' }}>
            View All Tours
          </Link>
        </div>
      </section>

      <ExplorerFooter />
    </>
  );
}
