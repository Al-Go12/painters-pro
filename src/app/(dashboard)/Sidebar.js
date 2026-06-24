'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  {
    href: '/clients',
    label: 'Clients',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
  {
    href: '/products',
    label: 'Products',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    href: '/quotations',
    label: 'Quotations',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

function SidebarContent({ onClose, onLogout, loggingOut }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">

      {/* ── Brand ── */}
      <div className="px-4 pt-6 pb-5 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Logo — fixed height container */}
            <div className="bg-white rounded-xl px-3 py-2 mb-3 shadow-sm inline-flex items-center">
              <img
                src="/nipponpaintlogo.png"
                alt="Nippon Paint"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-white font-black text-base leading-none tracking-tight">PainterPro</p>
              <p className="text-red-300 text-[11px] font-medium mt-1 leading-none">Quotation Manager</p>
            </div>
          </div>
          {/* Mobile close */}
          {onClose && (
            <button
              onClick={onClose}
              className="mt-0.5 text-red-300 hover:text-white transition-colors flex-shrink-0"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Orange accent bar */}
      <div className="h-px mx-4 flex-shrink-0" style={{ background: 'linear-gradient(to right, #F7941E, transparent)' }} />

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-bold text-red-400 uppercase tracking-[0.12em]">
          Navigation
        </p>

        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-white text-[var(--color-np-red)] shadow-sm'
                  : 'text-red-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              {/* Left active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-np-orange)] rounded-full" />
              )}
              <span className={`flex-shrink-0 transition-colors ${active ? 'text-[var(--color-np-red)]' : 'text-red-300 group-hover:text-white'}`}>
                {icon}
              </span>
              <span className="flex-1">{label}</span>
              {/* Active dot */}
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-np-orange)] flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer / Sign Out ── */}
      <div className="flex-shrink-0 px-3 pb-5 pt-3">
        <div className="h-px bg-white/10 mb-3 mx-1" />
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] flex-shrink-0 transition-colors group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [open,       setOpen]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else      document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[var(--color-np-red)] flex-shrink-0 shadow-xl">
        <SidebarContent onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[var(--color-np-red)] flex items-center px-4 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          className="text-white mr-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Logo + name inline */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white rounded-lg px-2.5 py-1.5">
            <img src="/nipponpaintlogo.webp" alt="Nippon Paint" className="h-6 w-auto object-contain" />
          </div>
          <span className="text-white font-black text-sm tracking-tight">PainterPro</span>
        </div>
      </div>

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[var(--color-np-red)] shadow-2xl transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setOpen(false)} onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>
    </>
  );
}
