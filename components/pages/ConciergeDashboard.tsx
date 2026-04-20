'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import {
  LayoutTemplate,
  CalendarDays,
  Users,
  DollarSign,
  Banknote,
} from 'lucide-react';
import TemplateManager from './TemplateManager';
import SlotGenerator from './SlotGenerator';
import CapacityMonitor from './CapacityMonitor';
import AuditLog from './AuditLog';

/* ─── Tab definitions ──────────────────────────────────────────────── */

type TabId = 'templates' | 'slots' | 'capacity' | 'audit' | 'settlement';

const TABS: { id: TabId; label: string }[] = [
  { id: 'templates',  label: 'Templates' },
  { id: 'slots',      label: 'Slots' },
  { id: 'capacity',   label: 'Capacity' },
  { id: 'audit',      label: 'Audit' },
  { id: 'settlement', label: 'Settlement' },
];

/* ─── Component ────────────────────────────────────────────────────── */

export default function ConciergeDashboard({
  activeTab,
  onTabChange,
}: {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}) {
  const { templates, slots, bookings } = useVegasStore();

  // Use activeTab from parent (controlled), fallback to local state
  const tab: TabId = (activeTab as TabId) || 'templates';

  function setTab(id: TabId) {
    onTabChange?.(id);
  }

  // ── Stats ──────────────────────────────────────────────────────
  const activeTemplates = templates.length;
  const scheduledSlots = slots.filter((s) => s.status === 'SCHEDULED').length;
  const totalPassengers = slots.reduce((sum, s) => sum + s.currentCapacity, 0);
  const revenuePipeline = bookings
    .filter((b) => b.paymentStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Concierge Command Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage tour templates, schedule slots, and monitor system activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              tab === t.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'templates' && <TemplateManager />}
      {tab === 'slots' && <SlotGenerator />}
      {tab === 'capacity' && <CapacityMonitor />}
      {tab === 'audit' && <AuditLog />}
      {tab === 'settlement' && <SettlementPanel />}
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
    <div className="bg-card border border-border rounded-xl p-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${accent}`} />
        <span className="text-2xl font-black text-foreground">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

/* ─── Settlement Panel ─────────────────────────────────────────────── */

import { useState } from 'react';

function SettlementPanel() {
  const store = useVegasStore();
  const [lastResult, setLastResult] = useState<number | null>(null);

  const depositBookings = store.bookings.filter(
    (b) => b.paymentStatus === 'DEPOSIT_PAID'
  );

  const handleRunSettlement = () => {
    const count = store.runDailySettlement();
    setLastResult(count);
  };

  return (
    <div className="space-y-4">
      {/* ═══ Simulation Clock ═══ */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CalendarDays className="w-6 h-6 text-info" />
          <h2 className="text-lg font-bold text-foreground">⏰ Simulation Clock</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Move the system clock forward to simulate time passing. This affects all
          date-dependent logic (payment thresholds, cancellation lockouts, settlement windows).
        </p>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={store.mockDateISO.split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value + 'T12:00:00').toISOString();
              store.setMockDate(newDate);
            }}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => store.setMockDate(new Date().toISOString())}
            className="px-3 py-2 text-xs font-semibold bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Reset to Today
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Current: <span className="font-mono text-foreground">{new Date(store.mockDateISO).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </p>
      </div>

      {/* ═══ Settlement Panel ═══ */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Banknote className="w-6 h-6 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Daily Settlement Simulator</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Auto-collects remaining 80% balance for deposit-paid bookings whose tour
          is within 7 days of the current simulation date.
        </p>

        <div className="bg-background/50 border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Settlements</p>
              <p className="text-3xl font-black text-foreground">{depositBookings.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold text-warning">
                ${depositBookings.reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunSettlement}
          disabled={depositBookings.length === 0}
          className="w-full px-4 py-3 bg-warning text-background font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⚡ Run Daily Settlement
        </button>

        {lastResult !== null && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            lastResult > 0
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {lastResult > 0
              ? `✅ Settlement complete: ${lastResult} booking${lastResult !== 1 ? 's' : ''} auto-collected.`
              : '⏳ No bookings eligible for settlement at this time.'}
          </div>
        )}
      </div>

      {/* Deposit bookings list */}
      {depositBookings.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Deposit-Paid Bookings</h3>
          </div>
          <div className="divide-y divide-border">
            {depositBookings.map((b) => {
              const slot = store.slots.find((s) => s.id === b.slotId);
              const template = slot ? store.templates.find((t) => t.id === slot.templateId) : null;
              const tourDate = slot ? new Date(slot.date).toLocaleDateString() : 'N/A';
              return (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{template?.title || b.slotId}</p>
                    <p className="text-xs text-muted-foreground">{b.id} • Tour: {tourDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-warning">
                      ${(b.totalAmount - b.amountPaid).toFixed(2)} due
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${b.amountPaid.toFixed(2)} / ${b.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
