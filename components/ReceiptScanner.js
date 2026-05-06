'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, X, Check } from 'lucide-react';

export default function ReceiptScanner({ onAdded, userId }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('shopping');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setAmount('');
    setMerchant('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'expense',
      amount: parseFloat(amount),
      description: merchant.trim() || 'Receipt purchase',
      category,
      date,
    });
    setSaving(false);
    if (!error) {
      reset();
      onAdded();
    } else alert('Error: ' + error.message);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mb-2">snap & log</div>
        <h2 className="font-display text-3xl sm:text-4xl italic font-light">Receipt scanner.</h2>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-ink/20 p-6 sm:p-12 text-center bg-paper">
            <Camera size={40} strokeWidth={1} className="mx-auto mb-4 text-ink/40 sm:hidden" />
            <Camera size={48} strokeWidth={1} className="mx-auto mb-4 text-ink/40 hidden sm:block" />
            <h3 className="font-display text-xl sm:text-2xl italic mb-2">Capture a receipt</h3>
            <p className="font-mono text-[11px] sm:text-xs text-ink/50 max-w-sm mx-auto leading-relaxed mb-5 sm:mb-6">
              Take a photo or upload an image. For now, you'll enter the details manually — automatic extraction is coming soon.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-ink text-cream px-5 py-3 font-mono text-xs uppercase tracking-widest hover:bg-rust active:bg-rust transition-colors"
              >
                <Camera size={14} /> take photo
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center justify-center gap-2 border border-ink/20 px-5 py-3 font-mono text-xs uppercase tracking-widest hover:bg-ink/5 active:bg-ink/10 transition-colors"
              >
                <Upload size={14} /> upload
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>

          <div className="p-4 sm:p-5 bg-ochre/10 border-l-4 border-ochre">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ochre mb-1">future feature</div>
            <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
              When OCR is wired up, this screen will auto-fill the merchant, amount, date, and line items from the photo. The form below stands in until then.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative mb-5 sm:mb-6">
            <img src={preview} alt="Receipt preview" className="w-full max-h-72 sm:max-h-96 object-contain bg-ink/5 border border-ink/10" />
            <button onClick={reset} aria-label="Remove" className="absolute top-2 right-2 bg-ink text-cream w-9 h-9 flex items-center justify-center hover:bg-rust active:bg-rust transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">merchant</label>
              <input required value={merchant} onChange={e => setMerchant(e.target.value)}
                placeholder="e.g. Trader Joe's"
                className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">total</label>
                <input type="number" inputMode="decimal" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60 block mb-2">category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-cream/50 border-b-2 border-ink/20 focus:border-rust">
                {['groceries','dining','transport','housing','utilities','entertainment','health','shopping','subscriptions','other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-4 font-display text-base sm:text-lg italic bg-ink text-cream hover:bg-rust active:bg-rust transition-colors">
              {saving ? '…' : <span className="flex items-center justify-center gap-2"><Check size={18} /> save receipt</span>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
