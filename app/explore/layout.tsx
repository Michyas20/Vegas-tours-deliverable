import { Syne, Outfit, Manrope } from 'next/font/google';
import '../globals-horizon.css';

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '700', '800'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500'],
});

export const metadata = {
  title: 'Vegas Horizon Tours — Unforgettable Group Tours',
  description:
    'Experience the majestic beauty of the Nevada desert. Small group tours to the Grand Canyon, Hoover Dam, Valley of Fire, and more.',
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`vegas-horizon ${syne.variable} ${outfit.variable} ${manrope.variable}`}
      style={{
        fontFamily: 'var(--font-manrope), sans-serif',
      }}
    >
      <style>{`
        .vegas-horizon h1, .vegas-horizon h2, .vegas-horizon h3,
        .vegas-horizon h4, .vegas-horizon h5, .vegas-horizon h6 {
          font-family: var(--font-syne), sans-serif;
        }
        .vegas-horizon .vh-primary-btn,
        .vegas-horizon .vh-ghost-btn,
        .vegas-horizon .vh-nav-btn,
        .vegas-horizon .vh-feature-item .feat-desc {
          font-family: var(--font-outfit), sans-serif;
        }
      `}</style>
      {children}
    </div>
  );
}
