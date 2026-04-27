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
  { id: 'settlement', label: 'Verification Hub' },
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
          Admin Command Center
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
      {tab === 'settlement' && <VerificationHub />}
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

/* ─── Verification Hub (Payment Verification) ───────────────────────── */

function VerificationHub() {
  const store = useVegasStore();

  const pendingBookings = store.bookings.filter(
    (b) => b.paymentStatus === 'PENDING'
  );

  return (
    <div className="space-y-4">
      {/* ═══ Payment Queue ═══ */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Banknote className="w-6 h-6 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Verification Hub</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Review and manually verify Zelle/Venmo transfers from guests. Matches are made via the Reference Code.
        </p>

        <div className="bg-background/50 border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Verifications</p>
              <p className="text-3xl font-black text-foreground">{pendingBookings.length}</p>
            </div>
            <div className="text-right">
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
            {pendingBookings.map((b) => {
              return (
                <div key={b.id} className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.guestInfo?.fullName || b.customerId}</p>
                    <p className="text-xs text-muted-foreground">Zelle/Venmo Reference Code:</p>
                    <code className="text-sm font-bold text-primary mt-1 inline-block uppercase bg-accent px-2 py-0.5 rounded">{b.id}</code>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount to Verify</p>
                      <p className="text-lg font-bold text-warning">
                        ${b.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => store.confirmPayment(b.id)}
                      className="px-4 py-2 bg-success text-white text-sm font-bold rounded-lg hover:bg-success/90 transition-colors shadow-lg shadow-success/20 flex items-center gap-2"
                    >
                      ✅ Verify Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
          All payments are fully verified! No pending transactions.
        </div>
      )}
    </div>
  );
}
