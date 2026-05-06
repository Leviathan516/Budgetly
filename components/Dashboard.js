'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Repeat, BarChart3, Camera, LogOut } from 'lucide-react';
import CalendarView from './CalendarView';
import QuickAdd from './QuickAdd';
import RecurringView from './RecurringView';
import Analytics from './Analytics';
import ReceiptScanner from './ReceiptScanner';

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'add', label: 'Quick Add', icon: Plus },
  { id: 'recurring', label: 'Recurring', icon: Repeat },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'receipt', label: 'Receipt', icon: Camera },
];

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('calendar');
  const [transactions, setTransactions] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tx, rc] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('recurring').select('*').order('next_date', { ascending: true }),
    ]);
    if (tx.data) setTransactions(tx.data);
    if (rc.data) setRecurring(rc.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Top-level totals for header
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthTx = transactions.filter(t => new Date(t.date) >= monthStart);
  const spent = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const earned = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const net = earned - spent;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-ink/10 bg-paper/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl italic font-light leading-none">Budgetly</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mt-1">
              {session.user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="font-mono text-xs uppercase tracking-widest text-ink/50 hover:text-rust flex items-center gap-2"
          >
            <LogOut size={14} /> sign out
          </button>
        </div>

        {/* Monthly summary banner */}
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <div className="grid grid-cols-3 gap-px bg-ink/10 border border-ink/10">
            <Stat label="Earned this month" value={`$${earned.toFixed(2)}`} accent="moss" />
            <Stat label="Spent this month" value={`$${spent.toFixed(2)}`} accent="rust" />
            <Stat label="Net" value={`${net >= 0 ? '+' : ''}$${net.toFixed(2)}`} accent={net >= 0 ? 'moss' : 'rust'} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 font-display italic text-ink/40 text-xl">loading your records…</div>
        ) : (
          <div className="animate-fade-in">
            {tab === 'calendar' && <CalendarView transactions={transactions} />}
            {tab === 'add' && <QuickAdd onAdded={loadData} userId={session.user.id} />}
            {tab === 'recurring' && <RecurringView recurring={recurring} onChange={loadData} userId={session.user.id} />}
            {tab === 'analytics' && <Analytics transactions={transactions} recurring={recurring} />}
            {tab === 'receipt' && <ReceiptScanner onAdded={loadData} userId={session.user.id} />}
          </div>
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-md border-t border-ink/10 z-40">
        <div className="max-w-6xl mx-auto px-2 py-2 flex justify-around">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                  active ? 'text-rust' : 'text-ink/50 hover:text-ink'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                <span className="font-mono text-[9px] uppercase tracking-widest">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Stat({ label, value, accent }) {
  const colors = {
    moss: 'text-moss',
    rust: 'text-rust',
  };
  return (
    <div className="bg-paper p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-2">{label}</div>
      <div className={`font-display text-3xl font-light ${colors[accent] || 'text-ink'}`}>{value}</div>
    </div>
  );
}
