'use client';

import { motion } from 'framer-motion';
import { Mountain } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ─── Nav items ────────────────────────────────────────────────────── */

const navItems = [
  { href: '/explore', label: 'Home' },
  { href: '/explore/tours', label: 'Tours' },
];

/* ─── Component ────────────────────────────────────────────────────── */

export default function ExplorerNavbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Page Indicator Bar ── */}
      <div className="vh-page-indicator-bar">
        <div className="vh-page-indicator-inner">
          {navItems.map((item) => {
            const isActive =
              item.href === '/explore'
                ? pathname === '/explore'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="vh-page-indicator-item"
                style={{ textDecoration: 'none' }}
              >
                <span
                  style={{
                    color: isActive ? '#F7C948' : 'rgba(255,255,255,0.45)',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'color 0.3s ease',
                    fontFamily: 'var(--font-syne)',
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="page-indicator-pill"
                    className="vh-indicator-pill"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav className="vh-navbar">
        <div className="vh-nav-container">
          <Link href="/explore" className="vh-logo">
            <Mountain color="#F7C948" size={32} />
            <span>Vegas Horizon</span>
          </Link>
          <Link href="/explore/tours" className="vh-nav-btn" style={{ textDecoration: 'none' }}>
            SEE TOURS
          </Link>
        </div>
      </nav>
    </>
  );
}
