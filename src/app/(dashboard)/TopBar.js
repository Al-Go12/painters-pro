'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SECTION = {
  '/clients':    'Clients',
  '/products':   'Products',
  '/quotations': 'Quotations',
};

function getTitle(pathname) {
  for (const [prefix, label] of Object.entries(SECTION)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return label;
  }
  return 'Dashboard';
}

function TodayDate() {
  const now = new Date();
  return now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function ProfileButton() {
  const router   = useRouter();
  const [user,   setUser]   = useState(null);
  const [show,   setShow]   = useState(false);
  const [logout, setLogout] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setShow(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleLogout() {
    setLogout(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="w-9 h-9 rounded-full bg-[var(--color-np-red)] text-white font-bold text-sm flex items-center justify-center hover:bg-[var(--color-np-red-dark)] transition-colors shadow-sm ring-2 ring-[var(--color-np-red)]/20 focus:outline-none"
        title={user?.email || ''}
      >
        {initial}
      </button>

      {show && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[var(--color-np-border)] overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3.5 border-b border-[var(--color-np-border)] bg-[var(--color-np-gray)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-np-red)] text-white font-bold text-base flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                {user?.name && <p className="font-bold text-sm text-[var(--color-np-text)] truncate">{user.name}</p>}
                <p className="text-xs text-[var(--color-np-muted)] truncate">{user?.email || 'Loading…'}</p>
              </div>
            </div>
          </div>
          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {logout ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const title    = getTitle(pathname);

  return (
    <header className="hidden lg:flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-8 h-14 bg-white shadow-sm">
        {/* Left — breadcrumb */}
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--color-np-red)] font-black text-sm tracking-tight">PainterPro</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[var(--color-np-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[var(--color-np-text)] font-bold text-sm">{title}</span>
        </div>

        {/* Right — date + profile */}
        <div className="flex items-center gap-4">
          <span className="text-[var(--color-np-muted)] text-xs font-medium">
            <TodayDate />
          </span>
          <ProfileButton />
        </div>
      </div>
      {/* Orange accent line */}
      <div className="h-0.5 bg-[var(--color-np-orange)]" />
    </header>
  );
}
