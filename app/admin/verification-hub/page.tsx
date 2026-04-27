'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import { useHasHydrated } from '@/lib/hooks';
import {
  Loader2,
  Banknote,
  LayoutTemplate,
  CalendarDays,
  Users,
  DollarSign,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function VerificationHubPage() {
  const hasHydrated = useHasHydrated();
  const store = useVegasStore();

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { templates, slots, bookings } = store;

  // Stats
  const activeTemplates = templates.length;
  const scheduledSlots = slots.filter((s) => s.status === 'SCHEDULED').length;
  const totalPassengers = slots.reduce((sum, s) => sum + s.currentCapacity, 0);
  const revenuePipeline = bookings
    .filter((b) => b.paymentStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingBookings = bookings.filter((b) => b.paymentStatus === 'PENDING');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Admin Top Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
                Admin Panel
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Vegas Horizon</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </span>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8">

        {/* Page heading */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Admin Command Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tour operations, verify payments, and monitor system activity.
          </p>
        </div>

        {/* Stat cards — 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={LayoutTemplate} label="Active Templates" value={activeTemplates} accent="text-primary" />
          <StatCard icon={CalendarDays} label="Scheduled Slots" value={scheduledSlots} accent="text-info" />
          <StatCard icon={Users} label="Total Passengers" value={totalPassengers} accent="text-success" />
          <StatCard
            icon={DollarSign}
            label="Revenue Pipeline"
            value={`$${revenuePipeline.toLocaleString()}`}
            accent="text-warning"
          />
        </div>

        {/* ═══ Verification Hub Section ═══ */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="w-6 h-6 text-warning" />
              <h2 className="text-lg font-bold text-foreground">Verification Hub</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Review and manually verify Zelle/Venmo transfers from guests. Matches are made via the Reference Code.
            </p>

            <div className="bg-background/50 border border-border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verifications</p>
                  <p className="text-3xl font-black text-foreground">{pendingBookings.length}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground">Unverified Revenue</p>
                  <p className="text-2xl font-bold text-warning">
                    ${pendingBookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending payments list */}
          {pendingBookings.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Awaiting Verification</h3>
              </div>
              <div className="divide-y divide-border">
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    {/* Guest info */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {b.guestInfo?.fullName || b.customerId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Zelle/Venmo Reference Code:</p>
                      <code className="text-sm font-bold text-primary mt-1 inline-block uppercase bg-accent px-2 py-0.5 rounded break-all">
                        {b.id}
                      </code>
                    </div>

                    {/* Amount + Verify button — stack on mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 shrink-0">
                      <div className="sm:text-right">
                        <p className="text-sm text-muted-foreground">Amount to Verify</p>
                        <p className="text-lg font-bold text-warning">
                          ${b.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => store.confirmPayment(b.id)}
                        className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-success text-white text-sm font-bold rounded-lg hover:bg-success/90 transition-colors shadow-lg shadow-success/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Verify Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              All payments are fully verified! No pending transactions.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

/* ─── Stat Card ────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 md:p-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${accent}`} />
        <span className="text-xl md:text-2xl font-black text-foreground">{value}</span>
      </div>
      <p className="text-[11px] md:text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

