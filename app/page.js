'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl italic text-ink/40">loading…</div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  return <Dashboard session={session} />;
}
