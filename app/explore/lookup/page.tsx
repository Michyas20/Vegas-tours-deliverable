'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ExplorerNavbar from '@/components/luxury-ui/ExplorerNavbar';
import ExplorerFooter from '@/components/luxury-ui/ExplorerFooter';
import { Search, Ticket } from 'lucide-react';

export default function LookupPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !email) {
      setError('Please provide both your Booking ID and Email address.');
      return;
    }
    
    // In a real production scenario, we'd fire an API call here to verify the email matches the booking ID
    // before redirecting, but for this guest flow we just route to the pass.
    router.push(`/confirmation/${bookingId.trim()}`);
  };

  return (
    <>
      <ExplorerNavbar />
      <main className="min-h-[80vh] flex flex-col items-center justify-center py-24 px-6 relative" style={{ backgroundColor: '#0A0A0A' }}>
        
        {/* Background Accents */}
        <div className="absolute top-0 inset-x-0 w-full h-[500px] overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full bg-warning/20 blur-[100px] pointer-events-none" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-8 h-8 text-warning" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
              Find Your Ticket
            </h1>
            <p className="text-white/60 text-sm">
              Enter your Booking ID and Email address to retrieve your digital boarding pass and check your payment status.
            </p>
          </div>

          <form onSubmit={handleLookup} className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Booking ID</label>
                <input
                  type="text"
                  placeholder="e.g. bk-deposit-01"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-warning/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-warning/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-warning text-black font-bold py-3.5 rounded-xl hover:bg-warning/90 transition-colors flex items-center justify-center gap-2"
              >
                <Search size={18} />
                Retrieve Boarding Pass
              </button>
            </div>
          </form>
        </div>
      </main>
      <ExplorerFooter />
    </>
  );
}
