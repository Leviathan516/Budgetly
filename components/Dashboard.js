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
  { id: 'calendar', label: 'Calendar', short: 'Cal', icon: Calendar },
  { id: 'add', label: 'Quick Add', short: 'Add', icon: Plus },
  { id: 'recurring', label: 'Recurring', short: 'Loop', icon: Repeat },
  { id: 'analytics', label: 'Analytics', short: 'Stats', icon: BarChart3 },
  { id: 'receipt', label: 'Receipt', short: 'Scan', icon: Camera },
];

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('calendar');
  const [transactions, setTransactions] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tx, rc] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('recurring').select('*').order('next_date', { ascending: true }),
      ]);
      if (tx.error) console.error('transactions query error:', tx.error);
      if (rc.error) console.error('recurring query error:', rc.error);
      setTransactions(Array.isArray(tx.data) ? tx.data : []);
      setRecurring(Array.isArray(rc.data) ? rc.data : []);
    } catch (e) {
      console.error('loadData failed:', e);
      setTransactions([]);
      setRecurring([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthTx = transactions.filter(t => new Date(t.date) >= monthStart);
  const spent = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const earned = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const net = earned - spent;

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="border-b border-ink/10 bg-paper/90 backdrop-blur-md sticky top-0 z-40 safe-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl italic font-light leading-none">Budgetly</h1>
            <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/40 mt-1 truncate">
              {session.user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-ink/50 hover:text-rust active:text-rust flex items-center gap-1.5 sm:gap-2 shrink-0 px-2 py-1"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">sign out</span>
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-3 gap-px bg-ink/10 border border-ink/10">
            <Stat label="Earned" fullLabel="Earned this month" value={earned} accent="moss" />
            <Stat label="Spent" fullLabel="Spent this month" value={spent} accent="rust" />
            <Stat label="Net" fullLabel="Net" value={net} accent={net >= 0 ? 'moss' : 'rust'} signed />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

      <nav className="tab-bar fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-md border-t border-ink/10 z-40 safe-bottom">
        <div className="max-w-6xl mx-auto px-1 sm:px-2 py-1.5 sm:py-2 flex justify-around">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 transition-colors min-w-0 flex-1 max-w-[100px] ${
                  active ? 'text-rust' : 'text-ink/50 hover:text-ink active:text-ink'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="font-mono text-[9px] uppercase tracking-widest hidden sm:inline">{t.label}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Stat({ label, fullLabel, value, accent, signed }) {
  const colors = { moss: 'text-moss', rust: 'text-rust' };
  const abs = Math.abs(value);
  const sign = signed && value >= 0 ? '+' : signed && value < 0 ? '-' : '';
  const display = abs >= 1000
    ? `${sign}$${Math.round(abs).toLocaleString()}`
    : `${sign}$${abs.toFixed(2)}`;

  return (
    <div className="bg-paper p-3 sm:p-5 min-w-0">
      <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/50 mb-1 sm:mb-2 truncate">
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{fullLabel}</span>
      </div>
      <div className={`font-display text-xl sm:text-3xl font-light truncate ${colors[accent] || 'text-ink'}`}>
        {display}
      </div>
    </div>
  );
}
