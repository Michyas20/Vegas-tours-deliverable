import type { Metadata } from 'next';
import '@/app/globals-horizon.css';

export const metadata: Metadata = {
  title: 'Guide Check-In — Vegas Horizon',
  description: 'Scan guest QR boarding passes for tour check-in.',
};

export default function GuideScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
