'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check } from 'lucide-react';

const CATEGORIES = [
  'groceries', 'dining', 'transport', 'housing', 'utilities',
  'entertainment', 'health', 'shopping', 'subscriptions', 'other',
];

export default function QuickAdd({ onAdded, userId }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date,
    });

    setSaving(false);

    if (!error) {
      setDone(true);
      setAmount('');
      setDescription('');
      setCategory('other');
      onAdded();
      setTimeout(() => setDone(false), 1500);
    } else {
      alert('Could not save: ' + error.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-2">new entry</div>
        <h2 className="font-display text-4xl italic font-light">Quick add.</h2>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Type toggle */}
        <div className="flex gap-px bg-ink/10 p-px">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-3 font-display text-lg italic transition-all ${
              type === 'expense' ? 'bg-rust text-cream' : 'bg-paper text-ink/60'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-3 font-display text-lg italic transition-all ${
              type === 'income' ? 'bg-moss text-cream' : 'bg-paper text-ink/60'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount, hero input */}
        <div className="border-b-2 border-ink py-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-2">amount</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl text-ink/30">$</span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent font-display text-5xl italic font-light placeholder-ink/20 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">
            description
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. lunch at the diner"
            className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">
              category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">
              date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full py-4 font-display text-lg italic text-cream transition-all ${
            done ? 'bg-moss' : type === 'income' ? 'bg-moss hover:bg-ink' : 'bg-ink hover:bg-rust'
          }`}
        >
          {done ? <span className="flex items-center justify-center gap-2"><Check size={20} /> saved</span> :
            saving ? '…' : 'record entry'}
        </button>
      </form>
    </div>
  );
}
