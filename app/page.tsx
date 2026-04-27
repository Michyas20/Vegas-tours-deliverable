import { redirect } from 'next/navigation';

// The public landing page lives at /explore.
// Redirect the root URL so visitors always land there.
export default function RootPage() {
  redirect('/explore');
}

