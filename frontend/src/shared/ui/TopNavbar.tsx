import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut } from 'lucide-react';

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  actions?: React.ReactNode;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

export function TopNavbar({
  title,
  subtitle,
  onSearch,
  searchValue = '',
  actions,
  userName,
  userRole,
  onLogout,
}: TopNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-6">
        {/* Left — page title */}
        <div className="min-w-0 flex-1">
          {subtitle && (
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{subtitle}</span>
          )}
          <h1 className="font-semibold text-lg text-slate-950 truncate leading-tight">{title}</h1>
        </div>

        {/* Right — user */}
        <div className="flex items-center gap-2">
          {onSearch && (
            <SearchInput
              value={searchValue}
              onChange={onSearch}
              placeholder="Search workspace"
              className="hidden w-64 lg:block"
            />
          )}

          {actions && (
            <div className="hidden items-center gap-1 sm:flex">
              {actions}
            </div>
          )}

          {/* User button */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2.5 py-1 shadow-sm transition-colors hover:bg-slate-50"
              id="topnav-user-btn"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm">
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-medium text-slate-700 max-w-[100px] truncate">
                {userName?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{userName || 'User'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{userRole || 'Member'}</p>
                </div>
                {onLogout && (
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:text-brand-red hover:bg-red-50/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 transition-colors"
      />
    </div>
  );
}
