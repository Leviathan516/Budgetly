import { createClient } from '@supabase/supabase-js';

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build/prerender, env vars may be unavailable.
    // Return a stub that won't crash; real calls happen on the client.
    if (typeof window === 'undefined') {
      return new Proxy({}, {
        get() {
          return () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
        },
      });
    }
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  _client = createClient(url, key);
  return _client;
}

// Proxy so `supabase.from(...)` and `supabase.auth.xxx` work as before
export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getClient();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
