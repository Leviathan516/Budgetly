'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Calendar as CalIcon, X } from 'lucide-react';
import { addWeeks, addMonths, parseISO, differenceInDays, format } from 'date-fns';

const FREQ_LABELS = { weekly: 'every week', biweekly: 'every 2 weeks', monthly: 'every month' };

export default function RecurringView({ recurring = [], onChange, userId }) {
  const [showForm, setShowForm] = useState(false);

  const incomes = recurring.filter(r => r.type === 'income');
  const expenses = recurring.filter(r => r.type === 'expense');
  const projection = projectNext30Days(recurring);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-2">scheduled</div>
          <h2 className="font-display text-3xl sm:text-4xl italic font-light">Money coming & going.</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-ink text-cream px-5 py-3 font-mono text-xs uppercase tracking-widest hover:bg-rust active:bg-rust transition-colors self-start sm:self-auto"
        >
          <Plus size={14} /> add scheduled
        </button>
      </div>

      <div className="mb-8 sm:mb-10 p-4 sm:p-6 border border-ink/10 bg-paper">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-3">next 30 days</div>
        <div className="grid grid-cols-3 gap-px bg-ink/10 border border-ink/10">
          <Cell label="In" value={`+$${formatAmt(projection.income)}`} color="text-moss" />
          <Cell label="Out" value={`−$${formatAmt(projection.expense)}`} color="text-rust" />
          <Cell label="Net" value={`${projection.net >= 0 ? '+' : '−'}$${formatAmt(Math.abs(projection.net))}`} color={projection.net >= 0 ? 'text-moss' : 'text-rust'} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        <Section title="Income" subtitle="paydays" items={incomes} onChange={onChange} accent="moss" />
        <Section title="Expenses" subtitle="bills & subscriptions" items={expenses} onChange={onChange} accent="rust" />
      </div>

      {showForm && <RecurringForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); onChange(); }} userId={userId} />}
    </div>
  );
}

function formatAmt(n) {
  return n >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(2);
}

function Cell({ label, value, color }) {
  return (
    <div className="bg-paper p-3 sm:p-4 min-w-0">
      <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className={`font-display text-lg sm:text-2xl ${color} truncate`}>{value}</div>
    </div>
  );
}

function Section({ title, subtitle, items, onChange, accent }) {
  const accentClass = accent === 'moss' ? 'border-moss' : 'border-rust';

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheduled item?')) return;
    await supabase.from('recurring').delete().eq('id', id);
    onChange();
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className={`font-display text-xl sm:text-2xl italic border-b-2 ${accentClass} pb-2 inline-block`}>{title}</h3>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mt-1">{subtitle}</div>
      </div>

      {items.length === 0 ? (
        <div className="font-display italic text-ink/40 py-6">none yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const days = differenceInDays(parseISO(item.next_date), new Date());
            const dayLabel = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days < 0 ? 'overdue' : `in ${days}d`;
            return (
              <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-paper border border-ink/10 group gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                    <span className="font-medium truncate">{item.description}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{item.category}</span>
                  </div>
                  <div className="font-mono text-[10px] sm:text-xs text-ink/50 mt-1 flex items-center gap-1.5 flex-wrap">
                    <CalIcon size={10} />
                    <span>{FREQ_LABELS[item.frequency]} · {format(parseISO(item.next_date), 'MMM d')} ({dayLabel})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={`font-display text-lg sm:text-xl whitespace-nowrap ${accent === 'moss' ? 'text-moss' : 'text-rust'}`}>
                    {accent === 'moss' ? '+' : '−'}${Number(item.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete"
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-ink/40 hover:text-rust active:text-rust p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecurringForm({ onClose, onSaved, userId }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('paycheck');
  const [frequency, setFrequency] = useState('biweekly');
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Hide bottom tab bar while this modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('recurring').insert({
      user_id: userId,
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      frequency,
      next_date: nextDate,
    });
    setSaving(false);
    if (!error) onSaved();
    else alert('Error: ' + error.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl border border-ink/10"
        style={{ backgroundColor: '#faf7f0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-ink/10 sticky top-0 z-10"
          style={{ backgroundColor: '#faf7f0' }}
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-1">new schedule</div>
            <h3 className="font-display text-2xl sm:text-3xl italic">Add recurring entry.</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center text-ink/50 hover:text-ink hover:bg-ink/5 active:bg-ink/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-8">
          <div className="flex gap-px bg-ink/10 p-px">
            <button type="button" onClick={() => { setType('income'); setCategory('paycheck'); }}
              className={`flex-1 py-2.5 font-display italic ${type === 'income' ? 'bg-moss text-cream' : 'bg-paper'}`}>
              Income
            </button>
            <button type="button" onClick={() => { setType('expense'); setCategory('bill'); }}
              className={`flex-1 py-2.5 font-display italic ${type === 'expense' ? 'bg-rust text-cream' : 'bg-paper'}`}>
              Expense
            </button>
          </div>

          <input required placeholder="description (e.g. Paycheck, Rent, Netflix)" value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />

          <input type="number" inputMode="decimal" step="0.01" required placeholder="amount" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />

          <input type="text" placeholder="category" value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}
              className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">next occurrence</label>
            <input type="date" required value={nextDate} onChange={e => setNextDate(e.target.value)}
              className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-mono text-xs uppercase tracking-widest border border-ink/20 hover:bg-ink/5 active:bg-ink/10">
              cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 font-display italic bg-ink text-cream hover:bg-rust active:bg-rust transition-colors">
              {saving ? '…' : 'save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function projectNext30Days(recurring) {
  const today = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  let income = 0, expense = 0;

  recurring.forEach(r => {
    if (!r.active) return;
    let occur = parseISO(r.next_date);
    while (occur <= end) {
      if (occur >= today) {
        if (r.type === 'income') income += Number(r.amount);
        else expense += Number(r.amount);
      }
      if (r.frequency === 'weekly') occur = addWeeks(occur, 1);
      else if (r.frequency === 'biweekly') occur = addWeeks(occur, 2);
      else if (r.frequency === 'monthly') occur = addMonths(occur, 1);
      else break;
    }
  });

  return { income, expense, net: income - expense };
}
