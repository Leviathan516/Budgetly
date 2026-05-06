'use client';

import { useState, useMemo, useEffect } from 'react';
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

  // Hide bottom tab bar when day-detail modal is open
  useEffect(() => {
    if (selected) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [selected]);

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
      ? `${format(startOfWeek(cursor), 'MMM d')} — ${format(endOfWeek(cursor), 'MMM d')}`
      : format(cursor, 'EEE, MMM d');

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <button onClick={() => navigate(-1)} aria-label="Previous" className="p-2 hover:bg-ink/5 active:bg-ink/10 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display text-2xl sm:text-3xl italic font-light text-center flex-1 sm:flex-none sm:min-w-[280px]">
            {headerLabel}
          </h2>
          <button onClick={() => navigate(1)} aria-label="Next" className="p-2 hover:bg-ink/5 active:bg-ink/10 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex bg-ink/5 p-1 rounded-full self-center">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 sm:px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest rounded-full transition-all ${
                view === v ? 'bg-ink text-cream' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && <MonthGrid cursor={cursor} dailyTotal={dailyTotal} onSelect={setSelected} />}
      {view === 'week' && <WeekStrip cursor={cursor} dailyTotal={dailyTotal} txByDate={txByDate} />}
      {view === 'day' && <DayDetail date={cursor} txByDate={txByDate} />}

      {/* Selected day modal — bottom sheet on mobile, centered card on desktop */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl border border-ink/10"
            style={{ backgroundColor: '#faf7f0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-ink/10 sticky top-0 z-10"
              style={{ backgroundColor: '#faf7f0' }}
            >
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-1">
                  {format(selected, 'EEEE')}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl italic font-light leading-none">
                  {format(selected, 'MMMM d')}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center text-ink/50 hover:text-ink hover:bg-ink/5 active:bg-ink/10 transition-colors -mt-1 -mr-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-6 pb-8">
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
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/50 text-center py-2 sm:py-3">
            <span className="sm:hidden">{d}</span>
            <span className="hidden sm:inline">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}</span>
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
              className={`aspect-square border-r border-b border-ink/5 p-1 sm:p-2 text-left flex flex-col transition-colors overflow-hidden ${
                isCurrent ? 'bg-paper' : 'bg-ink/[0.02] text-ink/30'
              } ${count > 0 ? 'hover:bg-ochre/10 active:bg-ochre/20 cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`font-mono text-[10px] sm:text-xs ${isToday ? 'bg-ink text-cream w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full' : ''}`}>
                {format(day, 'd')}
              </div>
              {count > 0 && (
                <div className="mt-auto space-y-0.5 w-full min-w-0">
                  {expense > 0 && (
                    <div className="text-[8px] sm:text-[10px] font-mono text-rust truncate">−${formatCompact(expense)}</div>
                  )}
                  {income > 0 && (
                    <div className="text-[8px] sm:text-[10px] font-mono text-moss truncate">+${formatCompact(income)}</div>
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

function WeekStrip({ cursor, dailyTotal, txByDate }) {
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
          <div key={key} className={`border ${isToday ? 'border-rust' : 'border-ink/10'} p-4 sm:p-5 bg-paper`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-baseline gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  {format(day, 'EEE')}
                </div>
                <div className="font-display text-lg sm:text-2xl italic truncate">{format(day, 'MMM d')}</div>
                {isToday && <span className="font-mono text-[9px] uppercase tracking-widest text-rust">today</span>}
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-baseline gap-0 sm:gap-4 font-mono text-xs sm:text-sm shrink-0">
                {income > 0 && <span className="text-moss whitespace-nowrap">+${income.toFixed(2)}</span>}
                {expense > 0 && <span className="text-rust whitespace-nowrap">−${expense.toFixed(2)}</span>}
                {list.length === 0 && <span className="text-ink/30">—</span>}
              </div>
            </div>
            {list.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-ink/5">
                {list.map(t => <TransactionRow key={t.id} tx={t} />)}
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
        <div className="bg-paper p-3 sm:p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">in</div>
          <div className="font-display text-xl sm:text-2xl text-moss">+${income.toFixed(2)}</div>
        </div>
        <div className="bg-paper p-3 sm:p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">out</div>
          <div className="font-display text-xl sm:text-2xl text-rust">−${expense.toFixed(2)}</div>
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
    <div className="flex items-center justify-between py-2 px-1 gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm truncate">{tx.description}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{tx.category}</div>
      </div>
      <div className={`font-mono text-sm whitespace-nowrap ${tx.type === 'income' ? 'text-moss' : 'text-rust'}`}>
        {tx.type === 'income' ? '+' : '−'}${Number(tx.amount).toFixed(2)}
      </div>
    </div>
  );
}

// Compact dollar formatting for tight calendar cells
function formatCompact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 100) return Math.round(n).toString();
  return n.toFixed(0);
}
