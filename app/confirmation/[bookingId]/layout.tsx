import type { Metadata } from 'next';
import '@/app/globals-horizon.css';

export const metadata: Metadata = {
  title: 'Your Boarding Pass — Vegas Horizon',
  description: 'View and print your digital boarding pass for your Vegas Horizon tour.',
};

export default function ConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
