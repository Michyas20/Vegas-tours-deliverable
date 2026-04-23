'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import MainLayout from '@/components/layout/MainLayout';
import ConciergeDashboard from '@/components/pages/ConciergeDashboard';
import { Compass, Map, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useHasHydrated } from '@/lib/hooks';

export default function Home() {
  const hasHydrated = useHasHydrated();
  const { currentRole } = useVegasStore();
  const [activeView, setActiveView] = useState('templates');

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout activeView={activeView} onNavigate={setActiveView}>
      {currentRole === 'CONCIERGE' && <ConciergeDashboard activeTab={activeView} onTabChange={setActiveView} />}

      {currentRole === 'EXPLORER' && (
        <PlaceholderView
          icon={Compass}
          title="Explorer Dashboard"
          subtitle="Browse tours, create bookings, and manage your trips."
          accentColor="text-info"
          message="Coming in Sprint 3 — The booking funnel and tour catalog will be built here."
        />
      )}

      {currentRole === 'GUIDE' && (
        <PlaceholderView
          icon={Map}
          title="Guide Dashboard"
          subtitle="View your schedule and passenger manifests."
          accentColor="text-success"
          message="Coming in Sprint 4 — Your assigned slots and passenger lists will appear here."
        />
      )}
    </MainLayout>
  );
}

/* ─── Placeholder for future sprints ───────────────────────────────── */

function PlaceholderView({
  icon: Icon,
  title,
  subtitle,
  accentColor,
  message,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accentColor: string;
  message: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="text-center max-w-md px-6">
        <div className={`w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-5`}>
          <Icon className={`w-8 h-8 ${accentColor}`} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-card border border-border text-xs text-muted-foreground">
          {message}
        </div>
      </div>
    </div>
  );
}
