'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, isSameDay, isSameMonth, parseISO,
} from 'date-fns';

export default function CalendarView({ transactions = [] }) {
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(null);

  // Group transactions by date string for fast lookup
  const txByDate = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const key = t.date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [transactions]);

  const dailyTotal = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    const day = txByDate[key] || [];
    const expense = day.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const income = day.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    return { expense, income, count: day.length };
  };

  const navigate = (dir) => {
    if (view === 'month') setCursor(dir > 0 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    if (view === 'week') setCursor(dir > 0 ? addWeeks(cursor, 1) : subWeeks(cursor, 1));
    if (view === 'day') setCursor(dir > 0 ? addDays(cursor, 1) : subDays(cursor, 1));
  };

  const headerLabel = view === 'month'
    ? format(cursor, 'MMMM yyyy')
    : view === 'week'
      ? `${format(startOfWeek(cursor), 'MMM d')} — ${format(endOfWeek(cursor), 'MMM d, yyyy')}`
      : format(cursor, 'EEEE, MMMM d');

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-ink/5 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display text-3xl italic font-light min-w-[280px]">{headerLabel}</h2>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-ink/5 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex bg-ink/5 p-1 rounded-full">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest rounded-full transition-all ${
                view === v ? 'bg-ink text-cream' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && <MonthGrid cursor={cursor} dailyTotal={dailyTotal} onSelect={setSelected} txByDate={txByDate} />}
      {view === 'week' && <WeekStrip cursor={cursor} dailyTotal={dailyTotal} onSelect={setSelected} txByDate={txByDate} />}
      {view === 'day' && <DayDetail date={cursor} txByDate={txByDate} />}

      {/* Selected day modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative bg-paper max-w-lg w-full max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl border border-ink/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-ink/10 sticky top-0 bg-paper z-10">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-1">
                  {format(selected, 'EEEE')}
                </div>
                <h3 className="font-display text-3xl italic font-light leading-none">
                  {format(selected, 'MMMM d')}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors -mt-1 -mr-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Card body */}
            <div className="p-6">
              <DayDetail date={selected} txByDate={txByDate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({ cursor, dailyTotal, onSelect }) {
  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  return (
    <div className="border border-ink/10">
      <div className="grid grid-cols-7 border-b border-ink/10">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="font-mono text-[10px] uppercase tracking-widest text-ink/50 text-center py-3">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const { expense, income, count } = dailyTotal(day);
          const isCurrent = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={i}
              onClick={() => count > 0 && onSelect(day)}
              className={`aspect-square border-r border-b border-ink/5 p-2 text-left flex flex-col transition-colors ${
                isCurrent ? 'bg-paper' : 'bg-ink/[0.02] text-ink/30'
              } ${count > 0 ? 'hover:bg-ochre/10 cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`font-mono text-xs ${isToday ? 'bg-ink text-cream w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
                {format(day, 'd')}
              </div>
              {count > 0 && (
                <div className="mt-auto space-y-0.5 w-full">
                  {expense > 0 && (
                    <div className="text-[10px] font-mono text-rust truncate">−${expense.toFixed(0)}</div>
                  )}
                  {income > 0 && (
                    <div className="text-[10px] font-mono text-moss truncate">+${income.toFixed(0)}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekStrip({ cursor, dailyTotal, onSelect, txByDate }) {
  const days = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });
  const today = new Date();

  return (
    <div className="space-y-3">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const list = txByDate[key] || [];
        const { expense, income } = dailyTotal(day);
        const isToday = isSameDay(day, today);
        return (
          <div key={key} className={`border ${isToday ? 'border-rust' : 'border-ink/10'} p-5 bg-paper`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  {format(day, 'EEE')}
                </div>
                <div className="font-display text-2xl italic">{format(day, 'MMMM d')}</div>
                {isToday && <span className="font-mono text-[10px] uppercase tracking-widest text-rust">today</span>}
              </div>
              <div className="flex gap-4 font-mono text-sm">
                {income > 0 && <span className="text-moss">+${income.toFixed(2)}</span>}
                {expense > 0 && <span className="text-rust">−${expense.toFixed(2)}</span>}
                {list.length === 0 && <span className="text-ink/30">—</span>}
              </div>
            </div>
            {list.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-ink/5">
                {list.map(t => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayDetail({ date, txByDate }) {
  const key = format(date, 'yyyy-MM-dd');
  const list = txByDate[key] || [];
  const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const income = list.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);

  if (list.length === 0) {
    return (
      <div className="text-center py-12 font-display italic text-ink/40">
        nothing recorded for this day.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-px bg-ink/10 border border-ink/10 mb-4">
        <div className="bg-paper p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">in</div>
          <div className="font-display text-2xl text-moss">+${income.toFixed(2)}</div>
        </div>
        <div className="bg-paper p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">out</div>
          <div className="font-display text-2xl text-rust">−${expense.toFixed(2)}</div>
        </div>
      </div>
      <div className="space-y-2">
        {list.map(t => <TransactionRow key={t.id} tx={t} />)}
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">{tx.description}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{tx.category}</div>
      </div>
      <div className={`font-mono text-sm ${tx.type === 'income' ? 'text-moss' : 'text-rust'}`}>
        {tx.type === 'income' ? '+' : '−'}${Number(tx.amount).toFixed(2)}
      </div>
    </div>
  );
}
