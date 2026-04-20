'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import type { SlotStatus } from '@/types';
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  CheckCircle2,
  Eye,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

/* ─── Status config ────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  SCHEDULED:   { label: 'Scheduled',   dot: 'bg-success',  bg: 'bg-success/10 text-success' },
  MAINTENANCE: { label: 'Maintenance', dot: 'bg-warning',  bg: 'bg-warning/10 text-warning' },
  COMPLETED:   { label: 'Completed',   dot: 'bg-muted',    bg: 'bg-accent text-muted-foreground' },
  SOLD_OUT:    { label: 'Sold Out',    dot: 'bg-danger',   bg: 'bg-danger/10 text-danger' },
  NEAR_FULL:   { label: 'Near Full',   dot: 'bg-warning',  bg: 'bg-warning/10 text-warning' },
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function CapacityMonitor() {
  const { slots, templates, users, vehicles, bookings, setSlotMaintenance, completeSlot, getBookingsForSlot, confirmPayment } = useVegasStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | SlotStatus>('ALL');
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  // ── Derive status label ─────────────────────────────────────────
  function getDisplayStatus(slot: typeof slots[0]) {
    if (slot.status === 'MAINTENANCE') return 'MAINTENANCE';
    if (slot.status === 'COMPLETED') return 'COMPLETED';
    if (slot.currentCapacity >= slot.maxCapacity) return 'SOLD_OUT';
    if (slot.currentCapacity >= slot.maxCapacity - 2) return 'NEAR_FULL';
    return 'SCHEDULED';
  }

  // ── Filter ──────────────────────────────────────────────────────
  const filtered = slots
    .filter((s) => {
      if (statusFilter === 'ALL') return true;
      return s.status === statusFilter;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div>
      {/* Header + Filter */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Live Capacity Monitor</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | SlotStatus)}
            className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Slot Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/40">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tour</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Guide</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-48">Capacity</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((slot) => {
              const template = templates.find((t) => t.id === slot.templateId);
              const guide = users.find((u) => u.id === slot.guideId);
              const vehicle = vehicles.find((v) => v.id === slot.vehicleId);
              const displayStatus = getDisplayStatus(slot);
              const statusCfg = STATUS_CONFIG[displayStatus];
              const capacityPct = slot.maxCapacity > 0 ? (slot.currentCapacity / slot.maxCapacity) * 100 : 0;
              const isExpanded = expandedSlot === slot.id;
              const slotBookings = isExpanded ? getBookingsForSlot(slot.id) : [];

              // Capacity bar color
              let barColor = 'bg-success';
              if (capacityPct >= 100) barColor = 'bg-danger';
              else if (capacityPct >= 85) barColor = 'bg-warning';

              return (
                <tr key={slot.id} className="border-b border-border last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground leading-tight">{template?.title || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{vehicle?.name || slot.vehicleId}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {guide?.name || slot.guideId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(capacityPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap w-10 text-right">
                        {slot.currentCapacity}/{slot.maxCapacity}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Manifest */}
                      <button
                        onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="View Manifest"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      {/* Maintenance Toggle */}
                      {slot.status === 'SCHEDULED' && (
                        <button
                          onClick={() => setSlotMaintenance(slot.id)}
                          className="p-1.5 rounded-md hover:bg-warning/10 text-muted-foreground hover:text-warning transition-colors"
                          title="Set Maintenance"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      )}

                      {/* Complete */}
                      {slot.status === 'SCHEDULED' && (
                        <button
                          onClick={() => completeSlot(slot.id)}
                          className="p-1.5 rounded-md hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                          title="Mark Completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No slots match the selected filter.
          </div>
        )}
      </div>

      {/* ── Expanded Manifest ─────────────────────────────────────── */}
      {expandedSlot && (() => {
        const slotBookings = getBookingsForSlot(expandedSlot);
        const slot = slots.find((s) => s.id === expandedSlot);
        if (!slot) return null;

        return (
          <div className="mt-4 bg-card border border-primary/20 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Passenger Manifest — {templates.find((t) => t.id === slot.templateId)?.title}
            </h4>

            {slotBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings for this slot yet.</p>
            ) : (
              <div className="space-y-2">
                {slotBookings
                  .filter((b) => b.paymentStatus !== 'CANCELLED')
                  .map((booking) => {
                    const customer = users.find((u) => u.id === booking.customerId) as { name: string } | undefined;
                    const displayName = booking.guestInfo?.fullName || customer?.name || booking.customerId;

                    const paymentBg =
                      booking.paymentStatus === 'FULLY_PAID'
                        ? 'bg-success/10 text-success'
                        : booking.paymentStatus === 'DEPOSIT_PAID'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-danger/10 text-danger';

                    return (
                      <div key={booking.id} className="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-accent/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.passengerCount} passenger{booking.passengerCount !== 1 ? 's' : ''} · {booking.pickupLocation.hotelName}
                            {booking.guestInfo?.email && ` · ${booking.guestInfo.email}`}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${paymentBg}`}>
                          {booking.paymentStatus.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-mono text-muted-foreground">
                          ${booking.totalAmount}
                        </span>
                        {booking.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => confirmPayment(booking.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-success text-white rounded-md hover:bg-success/90 transition-colors whitespace-nowrap"
                          >
                            ✅ Confirm Payment
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
