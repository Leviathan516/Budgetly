'use client';

import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval, startOfMonth, parseISO } from 'date-fns';

const PALETTE = ['#c4633f', '#5a6f4a', '#d4a04c', '#1a1a1a', '#8b6f47', '#a87b5d', '#6b8e7f', '#b8956a'];

export default function Analytics({ transactions, recurring }) {
  // Last 30 days daily
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date === key);
      const expense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const income = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      return { date: format(day, 'MMM d'), expense, income };
    });
  }, [transactions]);

  // By category, this month
  const categoryData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const map = {};
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart)
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Running balance over 30 days
  const balanceData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    let balance = 0;
    return days.map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date === key);
      const net = dayTx.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
      balance += net;
      return { date: format(day, 'MMM d'), balance: Math.round(balance * 100) / 100 };
    });
  }, [transactions]);

  const totalSpent = categoryData.reduce((s, c) => s + c.value, 0);
  const topCategory = categoryData[0];

  return (
    <div>
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-2">the ledger reviewed</div>
        <h2 className="font-display text-4xl italic font-light">Analytics.</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-20 font-display italic text-ink/40 text-xl">
          add some entries to see the picture take shape.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Headline numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 border border-ink/10">
            <Headline label="entries" value={transactions.length} />
            <Headline label="categories" value={categoryData.length} />
            <Headline label="top category" value={topCategory?.name || '—'} />
            <Headline label="month spend" value={`$${totalSpent.toFixed(0)}`} accent="rust" />
          </div>

          {/* Income vs Expense bar */}
          <Panel title="Daily flow" subtitle="last 30 days">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} interval={4} stroke="#1a1a1a40" />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke="#1a1a1a40" />
                <Tooltip contentStyle={{ background: '#faf7f0', border: '1px solid #1a1a1a20', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                <Bar dataKey="income" fill="#5a6f4a" />
                <Bar dataKey="expense" fill="#c4633f" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Category breakdown */}
            <Panel title="By category" subtitle="this month">
              {categoryData.length === 0 ? (
                <div className="font-display italic text-ink/40 py-8 text-center">no expenses yet this month.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                        {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#faf7f0', border: '1px solid #1a1a1a20', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-4">
                    {categoryData.slice(0, 6).map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                          <span className="font-mono text-xs uppercase tracking-wider">{c.name}</span>
                        </div>
                        <span className="font-mono text-xs">${c.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>

            {/* Running balance */}
            <Panel title="Running net" subtitle="last 30 days">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={balanceData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} interval={4} stroke="#1a1a1a40" />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke="#1a1a1a40" />
                  <Tooltip contentStyle={{ background: '#faf7f0', border: '1px solid #1a1a1a20', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                  <Line type="monotone" dataKey="balance" stroke="#1a1a1a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function Headline({ label, value, accent }) {
  return (
    <div className="bg-paper p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
      <div className={`font-display text-2xl mt-1 ${accent === 'rust' ? 'text-rust' : ''}`}>{value}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="border border-ink/10 bg-paper p-6">
      <div className="mb-4">
        <h3 className="font-display text-2xl italic">{title}</h3>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}
