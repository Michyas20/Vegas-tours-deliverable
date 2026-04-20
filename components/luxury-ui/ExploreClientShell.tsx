'use client';

import ToastProvider from '@/components/luxury-ui/ToastProvider';

export default function ExploreClientShell({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
