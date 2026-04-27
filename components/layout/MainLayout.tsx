'use client';

import { useVegasStore } from '@/lib/useVegasStore';
import type { UserRole } from '@/types';
import {
  LayoutTemplate,
  CalendarDays,
  BarChart3,
  ScrollText,
  Compass,
  BookOpen,
  Map,
  ClipboardList,
  ChevronDown,
  Sparkles,
  Shield,
  User,
} from 'lucide-react';
import { type ReactNode } from 'react';

/* ─── Navigation definitions per role ──────────────────────────────── */

interface NavItem {
  label: string;
  id: string;
  icon: React.ElementType;
}

const CONCIERGE_NAV: NavItem[] = [
  { label: 'Templates',        id: 'templates',  icon: LayoutTemplate },
  { label: 'Slot Scheduler',   id: 'slots',      icon: CalendarDays },
  { label: 'Capacity Monitor', id: 'capacity',   icon: BarChart3 },
  { label: 'Audit Log',        id: 'audit',      icon: ScrollText },
];

const EXPLORER_NAV: NavItem[] = [
  { label: 'Browse Tours', id: 'browse',      icon: Compass },
  { label: 'My Bookings',  id: 'my-bookings', icon: BookOpen },
];

const GUIDE_NAV: NavItem[] = [
  { label: 'My Schedule', id: 'schedule',  icon: Map },
  { label: 'Manifests',   id: 'manifests', icon: ClipboardList },
];

const NAV_MAP: Record<UserRole, NavItem[]> = {
  CONCIERGE: CONCIERGE_NAV,
  EXPLORER: EXPLORER_NAV,
  GUIDE: GUIDE_NAV,
};

const ROLE_META: Record<UserRole, { label: string; icon: React.ElementType; accent: string; bg: string }> = {
  CONCIERGE: { label: 'Admin', icon: Shield,   accent: 'text-primary',     bg: 'bg-primary/10' },
  EXPLORER:  { label: 'Explorer',  icon: Compass,  accent: 'text-info',        bg: 'bg-info/10' },
  GUIDE:     { label: 'Guide',     icon: User,     accent: 'text-success',     bg: 'bg-success/10' },
};

const ALL_ROLES: UserRole[] = ['CONCIERGE', 'EXPLORER', 'GUIDE'];

/* ─── Component ────────────────────────────────────────────────────── */

export default function MainLayout({
  activeView,
  onNavigate,
  children,
}: {
  activeView: string;
  onNavigate: (viewId: string) => void;
  children: ReactNode;
}) {
  const { currentRole, setCurrentRole } = useVegasStore();
  const navItems = NAV_MAP[currentRole];
  const roleMeta = ROLE_META[currentRole];
  const RoleIcon = roleMeta.icon;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
              Vegas Tours
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Command Center</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer — role switcher */}
        <div className="p-3 border-t border-border">
          <div className="relative">
            <select
              value={currentRole}
              onChange={(e) => {
                setCurrentRole(e.target.value as UserRole);
                // Navigate to first nav item of the new role
                const newNav = NAV_MAP[e.target.value as UserRole];
                if (newNav.length > 0) onNavigate(newNav[0].id);
              }}
              className="w-full appearance-none bg-accent text-foreground text-sm font-medium pl-3 pr-8 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {ALL_ROLES.map((role) => (
                <option key={role} value={role} hidden={role !== 'CONCIERGE'}>
                  {ROLE_META[role].label} View
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </aside>

      {/* ── Right panel (Navbar + Content) ──────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-6">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleMeta.bg} ${roleMeta.accent}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              {roleMeta.label}
            </span>
            <span className="text-muted">/</span>
            <span className="font-medium text-foreground">
              {navItems.find((n) => n.id === activeView)?.label ?? 'Dashboard'}
            </span>
          </div>

          {/* Right: system clock indicator */}
          <div className="text-xs text-muted-foreground font-mono">
            System Active
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
