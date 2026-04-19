'use client';

import { useVegasStore, BookingError } from '@/lib/useVegasStore';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';
import { useState } from 'react';
import { addDays, format, isWeekend, parseISO } from 'date-fns';

/* ─── Types ────────────────────────────────────────────────────────── */

interface SlotResult {
  date: string;
  success: boolean;
  slotId?: string;
  error?: string;
}

/* ─── Component ────────────────────────────────────────────────────── */

export default function SlotGenerator() {
  const { templates, users, vehicles, createSlot } = useVegasStore();

  const guides = users.filter((u) => u.role === 'GUIDE');

  // ── Form state ──────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [guideId, setGuideId] = useState(guides[0]?.id || '');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [results, setResults] = useState<SlotResult[]>([]);

  // ── Generate slots ──────────────────────────────────────────────
  function handleGenerate() {
    const newResults: SlotResult[] = [];

    if (bulkMode && startDate && endDate) {
      // Bulk mode: iterate dates
      let current = parseISO(startDate);
      const end = parseISO(endDate);

      while (current <= end) {
        const dateStr = current.toISOString();

        if (skipWeekends && isWeekend(current)) {
          newResults.push({
            date: format(current, 'MMM d, yyyy'),
            success: false,
            error: 'Skipped (weekend)',
          });
        } else {
          try {
            const slotId = createSlot({
              templateId,
              date: dateStr,
              guideId,
              vehicleId,
            });
            newResults.push({
              date: format(current, 'MMM d, yyyy'),
              success: true,
              slotId,
            });
          } catch (err) {
            newResults.push({
              date: format(current, 'MMM d, yyyy'),
              success: false,
              error: err instanceof BookingError ? err.message : 'Unknown error',
            });
          }
        }

        current = addDays(current, 1);
      }
    } else if (!bulkMode && singleDate) {
      // Single date mode
      try {
        const slotId = createSlot({
          templateId,
          date: new Date(singleDate).toISOString(),
          guideId,
          vehicleId,
        });
        newResults.push({
          date: format(new Date(singleDate), 'MMM d, yyyy'),
          success: true,
          slotId,
        });
      } catch (err) {
        newResults.push({
          date: format(new Date(singleDate), 'MMM d, yyyy'),
          success: false,
          error: err instanceof BookingError ? err.message : 'Unknown error',
        });
      }
    }

    setResults(newResults);
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success && r.error !== 'Skipped (weekend)').length;
  const skipCount = results.filter((r) => r.error === 'Skipped (weekend)').length;

  return (
    <div>
      {/* Generator Form */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">Generate Tour Slots</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Template */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (${t.basePricePerPerson}/person)
                </option>
              ))}
            </select>
          </div>

          {/* Guide */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Guide</label>
            <select
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              {guides.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.capacity} seats) — {v.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setBulkMode(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !bulkMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Single Date
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              bulkMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Bulk Range
          </button>
        </div>

        {/* Date inputs */}
        {bulkMode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipWeekends}
                  onChange={(e) => setSkipWeekends(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">Skip Weekends</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="max-w-xs mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tour Date</label>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={bulkMode ? !startDate || !endDate : !singleDate}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Rocket className="w-4 h-4" /> Generate Slot{bulkMode ? 's' : ''}
        </button>
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Generation Results</h3>
            <div className="flex items-center gap-3 text-xs">
              {successCount > 0 && (
                <span className="inline-flex items-center gap-1 text-success font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {successCount} created
                </span>
              )}
              {skipCount > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                  <MinusCircle className="w-3.5 h-3.5" /> {skipCount} skipped
                </span>
              )}
              {failCount > 0 && (
                <span className="inline-flex items-center gap-1 text-danger font-medium">
                  <XCircle className="w-3.5 h-3.5" /> {failCount} failed
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  r.success
                    ? 'bg-success/5 border border-success/20'
                    : r.error === 'Skipped (weekend)'
                    ? 'bg-accent border border-border'
                    : 'bg-danger/5 border border-danger/20'
                }`}
              >
                {r.success ? (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                ) : r.error === 'Skipped (weekend)' ? (
                  <MinusCircle className="w-4 h-4 text-muted flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
                )}
                <span className="font-medium text-foreground">{r.date}</span>
                {r.slotId && (
                  <span className="text-xs text-muted-foreground font-mono">{r.slotId}</span>
                )}
                {r.error && (
                  <span className="text-xs text-muted-foreground ml-auto">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
