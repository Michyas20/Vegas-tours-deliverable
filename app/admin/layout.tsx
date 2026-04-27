// Force the entire /admin route group to skip static prerendering.
// This ensures Supabase env vars are available at runtime, not build time.
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
