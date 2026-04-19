// ═══════════════════════════════════════════════════════════════════
// Vegas Tours — Shared Utilities
// Layer: Shared (used by L1 engines and L2 store)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generates a prefixed unique ID.
 * Example: generateId('bk') → 'bk-1713520656789'
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Formats a number as USD currency.
 * Example: formatCurrency(1234.5) → '$1,234.50'
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Formats an ISO 8601 date string to a human-readable display string.
 * Example: formatDate('2026-04-19T10:00:00Z') → 'Apr 19, 2026'
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats an ISO 8601 date string including time.
 * Example: formatDateTime('2026-04-19T10:00:00Z') → 'Apr 19, 2026, 10:00 AM'
 */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
