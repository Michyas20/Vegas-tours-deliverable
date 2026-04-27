'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ConciergeDashboard from '@/components/pages/ConciergeDashboard';
import { useHasHydrated } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

export default function VerificationHubPage() {
  const hasHydrated = useHasHydrated();
  const [activeView, setActiveView] = useState('settlement');

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout activeView={activeView} onNavigate={setActiveView}>
      <ConciergeDashboard activeTab={activeView} onTabChange={setActiveView} />
    </MainLayout>
  );
}
