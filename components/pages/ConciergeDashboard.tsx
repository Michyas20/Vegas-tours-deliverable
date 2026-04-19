'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import {
  LayoutTemplate,
  CalendarDays,
  Users,
  DollarSign,
} from 'lucide-react';
import TemplateManager from './TemplateManager';
import SlotGenerator from './SlotGenerator';
import CapacityMonitor from './CapacityMonitor';
import AuditLog from './AuditLog';

/* ─── Tab definitions ──────────────────────────────────────────────── */

type TabId = 'templates' | 'slots' | 'capacity' | 'audit';

const TABS: { id: TabId; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'slots',     label: 'Slots' },
  { id: 'capacity',  label: 'Capacity' },
  { id: 'audit',     label: 'Audit' },
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
