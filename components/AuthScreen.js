'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 sm:px-6 py-8">
      <div className="max-w-md w-full">
        <div className="mb-10 sm:mb-12 text-center animate-fade-in">
          <div className="inline-block px-3 py-1 bg-ink text-cream font-mono text-[10px] uppercase tracking-[0.3em] rounded-full mb-5 sm:mb-6">
            est. 2025
          </div>
          <h1 className="font-display text-6xl sm:text-7xl italic font-light text-ink leading-none">
            Budgetly
          </h1>
          <p className="font-display italic text-ink/50 mt-3 sm:mt-4 text-base sm:text-lg">
            your money, on paper.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">
              email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust text-ink rounded-none transition-colors"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">
              password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust text-ink rounded-none transition-colors"
            />
          </div>

          {message && (
            <div className="text-sm font-mono text-rust py-2">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-cream py-4 font-display text-lg italic hover:bg-rust transition-colors disabled:opacity-50"
          >
            {loading ? '…' : mode === 'signup' ? 'create account' : 'sign in'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className="w-full font-mono text-xs uppercase tracking-widest text-ink/50 hover:text-ink py-2"
          >
            {mode === 'signup' ? '← already have an account' : 'need an account? →'}
          </button>
        </form>
      </div>
    </div>
  );
}
