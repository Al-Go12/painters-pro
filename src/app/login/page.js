'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim())               { setError('Email is required.');                      return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.');            return; }
    if (!password)                   { setError('Password is required.');                   return; }
    if (password.length < 6)         { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); return; }
      router.push('/clients');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-np-cream)] px-4">

      {/* Brand header — logo + name on one line */}
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-white rounded-xl px-4 py-2.5 shadow-md flex-shrink-0">
          <img
            src="/nipponpaintlogo.png"
            alt="Nippon Paint"
            className="h-9 w-auto object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--color-np-red)] tracking-tight leading-none">
            PainterPro
          </h1>
          <p className="text-[11px] text-[var(--color-np-muted)] font-medium tracking-widest uppercase mt-1">
            Quotation Manager
          </p>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-[var(--color-np-border)] overflow-hidden">
        {/* Red + orange top strip */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--color-np-red)] to-[var(--color-np-orange)]" />

        <div className="px-8 py-8">
          <h2 className="text-xl font-bold text-[var(--color-np-text)] mb-1">Welcome back</h2>
          <p className="text-sm text-[var(--color-np-muted)] mb-7">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-np-text)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--color-np-border)] bg-[var(--color-np-gray)] text-[var(--color-np-text)] placeholder-[var(--color-np-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-np-red)] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-np-muted)] hover:text-[var(--color-np-text)] transition-colors"
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span className="text-red-600 text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--color-np-red)] text-white font-bold text-sm hover:bg-[var(--color-np-red-dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
