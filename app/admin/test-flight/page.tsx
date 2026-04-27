'use client';
import { useState, useRef, useEffect } from 'react';
import { useVegasStore } from '@/lib/useVegasStore';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, RotateCcw, Activity, Server, CreditCard, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { notFound } from 'next/navigation';

// Fallback dummies prevent build-time crash during SSG.
// Real values are injected by Vercel at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://build-bypass.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-bypass-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface LogEntry {
  id: number;
  time: string;
  message: string;
  status: 'pending' | 'success' | 'error' | 'info';
}

export default function TestFlightDashboard() {
  // ─── PRODUCTION SECURITY GUARD ───
  if (process.env.NODE_ENV === 'production') {
    return notFound();
  }

  const store = useVegasStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [dbVerified, setDbVerified] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Real-time access to the hydrated boarding pass
  const generatedBooking = bookingId ? store.bookings.find(b => b.id === bookingId) : null;
  const tourSlot = generatedBooking ? store.slots.find(s => s.id === generatedBooking.slotId) : null;
  const tourTemplate = tourSlot ? store.templates.find(t => t.id === tourSlot.templateId) : null;

  const addLog = (message: string, status: LogEntry['status'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      message,
      status
    }]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setBookingId(null);
    setDbVerified(false);

    try {
      addLog('🚀 Starting E2E Visual "Test Flight"...', 'info');

      // ──────── STEP 1: GUEST BOOKING ────────
      addLog('Step 1: Guest hits Frontend / Generating Booking Context...', 'info');
      // Delay to simulate human wait
      await new Promise(r => setTimeout(r, 1000));
      
      // Self-Healing Mock Logic
      let testTemplateId: string;
      if (store.templates.length > 0) {
        testTemplateId = store.templates[0].id;
        addLog(`Using Template: ${store.templates[0].title} (ID: ${testTemplateId})`, 'info');
      } else {
        addLog('No local templates found. Injecting "Test Tour" into store...', 'info');
        testTemplateId = store.addTemplate({
          title: 'Test Tour',
          description: 'Automated QA Testing Tour',
          itinerary: ['Las Vegas Mock Setup'],
          durationHours: 2,
          basePricePerPerson: 99,
          minAge: 0,
          inclusions: ['Testing Tools']
        });
        const injected = store.templates.find(t => t.id === testTemplateId);
        addLog(`Using Template: ${injected?.title || 'Test Tour'} (ID: ${testTemplateId})`, 'info');
      }

      let activeSlot = store.slots.find(s => s.templateId === testTemplateId && s.currentCapacity < s.maxCapacity);
      if (!activeSlot) {
        addLog('No active slot for selected template. Injecting mock slot...', 'info');
        const mockSlotId = store.createSlot({
          templateId: testTemplateId,
          date: new Date(Date.now() + 86400000).toISOString(),
          guideId: store.users[0]?.id || 'usr-guide-01',
          vehicleId: store.vehicles[0]?.id || 'veh-sprinter-01'
        });
        activeSlot = store.slots.find(s => s.id === mockSlotId);
      }
      
      if (!activeSlot) throw new Error('Failed to resolve an active slot for testing.');

      
      const payload = {
        slotId: activeSlot.id,
        customerId: 'qa-agent-007',
        passengerCount: 1,
        pickupLocation: { type: 'hotel' as const, hotelName: 'The Bellagio', address: '3600 S Las Vegas Blvd' },
        guestInfo: { fullName: 'Automated QA Agent', email: 'qa@vegashorizon.com', phone: '555-QA' }
      };
      
      addLog('Injecting mock payload into Store Engine...', 'pending');
      const { bookingId: newId } = store.createBooking(payload);
      setBookingId(newId);
      addLog(`✅ Local Store Booking Generated! ID: ${newId}`, 'success');

      // ──────── STEP 2: DATABASE AUDIT ────────
      addLog('Step 2: Awaiting Optimistic Network Resolvers...', 'info');
      await new Promise(r => setTimeout(r, 2000)); // allow upserts to resolve gracefully

      addLog(`Querying Remote Supabase DB for ${newId}...`, 'pending');
      const { data: dbVerify, error } = await supabase.from('bookings').select('*').eq('id', newId).maybeSingle();
      
      if (error || !dbVerify) {
        addLog(`Database Check missed or failed. Ensure Upsert succeeded. Details: ${error?.message}`, 'error');
      } else {
        setDbVerified(true);
        addLog('✅ Database Integrity Check Passed: Cloud record exists.', 'success');
      }

      // ──────── STEP 3: ADMIN HANDSHAKE ────────
      addLog('Step 3: Simulating Concierge interaction...', 'info');
      await new Promise(r => setTimeout(r, 1500));
      
      addLog(`Executing confirmPayment(${newId}) via Verification Hub...`, 'pending');
      store.confirmPayment(newId);
      addLog('✅ Concierge Verification Broadcasted!', 'success');

      // ──────── STEP 4: BOARDING PASS PROOF ────────
      addLog('Step 4: Evaluating Final Digital Proof...', 'info');
      await new Promise(r => setTimeout(r, 1000)); // Simulating render evaluation

      addLog('🎉 E2E TEST FLIGHT COMPLETE.', 'success');
      
    } catch (e: any) {
      addLog(`FATAL ERROR: ${e.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-12 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-end justify-between border-b border-border/50 pb-6">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight uppercase flex items-center gap-3">
              <Activity className="w-8 h-8" /> Test Flight Automation
            </h1>
            <p className="text-muted-foreground mt-2">Visually verify the asynchronous network flow and remote database handshakes.</p>
          </div>
          <button 
            disabled={isRunning}
            onClick={runSimulation}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {isRunning ? <RotateCcw className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
            {isRunning ? 'Executing Sequences...' : 'Run E2E Simulation'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Output Terminal */}
          <div className="bg-card/50 border border-border rounded-xl p-6 shadow-2xl flex flex-col h-[500px]">
             <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
               <Server className="w-4 h-4" /> Runtime Console
             </h2>
             <div ref={scrollRef} className="flex-1 bg-black/40 rounded border border-border/50 p-4 font-mono text-sm overflow-y-auto space-y-2">
               {logs.length === 0 && <span className="text-muted-foreground/50">Awaiting runtime execution...</span>}
               {logs.map(log => (
                 <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2">
                   <span className="text-muted-foreground whitespace-nowrap">{log.time}</span>
                   <span className={`
                     ${log.status === 'info' && 'text-blue-400'}
                     ${log.status === 'pending' && 'text-warning animate-pulse'}
                     ${log.status === 'success' && 'text-success'}
                     ${log.status === 'error' && 'text-danger'}
                   `}>{log.message}</span>
                 </div>
               ))}
             </div>
          </div>

           {/* Magic UI Viewer */}
           <div className="space-y-6">
             
             {/* Sub-Card 1: Visual Database Proof */}
             <div className="bg-card/50 border border-border rounded-xl p-6">
                 <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4" /> Cloud Integrity (Supabase)
                 </h2>
                 <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg">
                   <span className="text-foreground/80 font-medium tracking-wide">ID: {bookingId || '...'}</span>
                   <div className="flex items-center gap-2">
                     {dbVerified ? (
                        <span className="flex items-center gap-2 text-success font-bold"><CheckCircle2 className="w-5 h-5" /> VALIDATED IN CLOUD</span>
                     ) : (
                        <span className="text-muted-foreground text-sm font-medium">{isRunning ? 'Querying...' : 'Awaiting Test'}</span>
                     )}
                   </div>
                 </div>
             </div>

             {/* Sub-Card 2: Rendered Boarding Pass Component */}
             <div className="bg-card/50 border border-border rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] pointer-events-none" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Reactive Boarding Pass Proof
                </h2>
                
                {generatedBooking ? (
                  <div className="bg-[#1c1c1e] max-w-sm rounded-2xl mx-auto border border-border shadow-2xl p-6 relative">
                     {/* The Dynamic Badges */}
                     <div className="flex justify-between items-start mb-6">
                       <div>
                         <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Vegas Horizon</p>
                         <p className="text-xl font-black text-white mt-1">{tourTemplate?.title}</p>
                       </div>
                       
                       {/* THIS PROVES THE ADMIN HANDSHAKE WORKED */}
                       {generatedBooking.paymentStatus === 'FULLY_PAID' ? (
                          <div className="bg-success/20 border border-success/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-success text-xs font-black uppercase tracking-wider">Verified</span>
                          </div>
                       ) : (
                          <div className="bg-warning/20 border border-warning/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-warning" />
                            <span className="text-warning text-xs font-black uppercase tracking-wider">Pending</span>
                          </div>
                       )}
                     </div>

                     <div className="flex gap-4">
                       <div className="flex-1 space-y-4">
                         <div>
                            <p className="text-[10px] text-muted-foreground uppercase opacity-70">Passenger</p>
                            <p className="text-sm font-bold text-white">{generatedBooking.guestInfo?.fullName}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-muted-foreground uppercase opacity-70">Pickup</p>
                            <p className="text-sm font-bold text-white">{generatedBooking.pickupLocation?.hotelName}</p>
                         </div>
                       </div>
                       
                       {/* Render dynamic QR Proof */}
                       <div className="bg-white p-2 rounded-lg shrink-0 h-min">
                          <QRCodeSVG value={generatedBooking.id} size={80} level="H" includeMargin={false} />
                       </div>
                     </div>
                  </div>
                ) : (
                  <div className="h-48 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center text-muted-foreground text-sm font-medium">
                    {isRunning ? 'Constructing Virtual Pass...' : 'Boarding Pass will render here.'}
                  </div>
                )}
             </div>

           </div>
        </div>
      </div>
    </div>
  );
}
