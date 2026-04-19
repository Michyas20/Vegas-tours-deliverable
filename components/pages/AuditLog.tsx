'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import type { AuditAction } from '@/types';
import {
  Plus,
  X,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

/* ─── Action badge config ──────────────────────────────────────────── */

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: React.ElementType; color: string; bg: string; isFinancial: boolean }> = {
  BOOKING_CREATED:  { label: 'Booking Created',  icon: Plus,           color: 'text-info',    bg: 'bg-info/10',    isFinancial: false },
  BOOKING_CANCELLED:{ label: 'Cancelled',        icon: X,              color: 'text-danger',  bg: 'bg-danger/10',  isFinancial: false },
  PAYMENT_DEPOSIT:  { label: 'Deposit',          icon: DollarSign,     color: 'text-warning', bg: 'bg-warning/10', isFinancial: true },
  PAYMENT_FULL:     { label: 'Full Payment',     icon: DollarSign,     color: 'text-success', bg: 'bg-success/10', isFinancial: true },
  SLOT_CREATED:     { label: 'Slot Created',     icon: Calendar,       color: 'text-primary', bg: 'bg-primary/10', isFinancial: false },
  SLOT_MAINTENANCE: { label: 'Maintenance',      icon: AlertTriangle,  color: 'text-warning', bg: 'bg-warning/10', isFinancial: false },
  SLOT_COMPLETED:   { label: 'Completed',        icon: CheckCircle2,   color: 'text-muted-foreground', bg: 'bg-accent', isFinancial: false },
  CAPACITY_ADJUSTED:{ label: 'Capacity Adj.',    icon: Users,          color: 'text-info',    bg: 'bg-info/10',    isFinancial: false },
};

const ALL_ACTIONS: AuditAction[] = [
  'BOOKING_CREATED', 'BOOKING_CANCELLED', 'PAYMENT_DEPOSIT', 'PAYMENT_FULL',
  'SLOT_CREATED', 'SLOT_MAINTENANCE', 'SLOT_COMPLETED', 'CAPACITY_ADJUSTED',
];

/* ─── Component ────────────────────────────────────────────────────── */

export default function AuditLog() {
  const { auditLog } = useVegasStore();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [limit, setLimit] = useState(50);

  // ── Filter & sort ───────────────────────────────────────────────
  const filtered = auditLog
    .filter((entry) => {
      if (actionFilter !== 'ALL' && entry.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          entry.details.toLowerCase().includes(q) ||
          entry.entityId.toLowerCase().includes(q) ||
          entry.action.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  const totalFiltered = auditLog.filter((entry) => {
    if (actionFilter !== 'ALL' && entry.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return entry.details.toLowerCase().includes(q) || entry.entityId.toLowerCase().includes(q);
    }
    return true;
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">System Heartbeat</h3>
        <span className="text-xs text-muted-foreground">{auditLog.length} total entries</span>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search audit log…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | 'ALL')}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          >
            <option value="ALL">All Actions</option>
            {ALL_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {ACTION_CONFIG[action].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit entries */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
          {auditLog.length === 0
            ? 'No system activity recorded yet. Actions will appear here as you use the system.'
            : 'No entries match your search/filter criteria.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const config = ACTION_CONFIG[entry.action];
            const Icon = config.icon;

            return (
              <div
                key={entry.id}
                className={`flex items-start gap-4 px-4 py-3 rounded-xl bg-card border transition-colors ${
                  config.isFinancial ? 'border-l-2 border-l-warning border-border' : 'border-border'
                } hover:border-border-light`}
              >
                {/* Icon */}
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted font-mono">
                      {entry.entityType}:{entry.entityId.substring(0, 16)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{entry.details}</p>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {totalFiltered > limit && (
            <button
              onClick={() => setLimit((l) => l + 50)}
              className="w-full py-3 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Load more ({totalFiltered - limit} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
