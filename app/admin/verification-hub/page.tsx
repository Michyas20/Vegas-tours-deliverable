'use client';
export const dynamic = 'force-dynamic';

import { useVegasStore } from '@/lib/useVegasStore';
import MainLayout from '@/components/layout/MainLayout';
import ConciergeDashboard from '@/components/pages/ConciergeDashboard';
import { useHasHydrated } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

export default function VerificationHubPage() {
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout activeView="settlement" onNavigate={(view) => window.location.href = `/?view=${view}`}>
      <ConciergeDashboard activeTab="settlement" onTabChange={(tab) => {}} />
    </MainLayout>
  );
}
