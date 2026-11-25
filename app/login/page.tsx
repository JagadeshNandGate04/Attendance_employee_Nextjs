'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/app/store/hooks';
import { login } from '@/app/store/auth/authSlice';
import ChangePasswordModal from '@/app/components/ChangePasswordModal';

const TIMEZONE = 'Asia/Kolkata';
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getISTComponents() {
  const now = new Date();
  try {
    const dtf = new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const map: Record<string, string> = {};
    dtf.formatToParts(now).forEach((p) => {
      map[p.type] = p.value;
    });
    return {
      year: parseInt(map.year, 10),
      month: parseInt(map.month, 10) - 1,
      day: parseInt(map.day, 10),
      weekday: map.weekday,
      hour: map.hour,
      minute: map.minute,
    };
  } catch {
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      hour: String(now.getHours()).padStart(2, '0'),
      minute: String(now.getMinutes()).padStart(2, '0'),
    };
  }
}

const TABS = [
  { top: '8.8%', w: 28, h: 46, bg: '#5D6953', edge: '#F6F8F3' },
  { top: '38.6%', w: 36, h: 56, bg: '#68775C', edge: '#EAF0E6' },
  { top: '69.5%', w: 37, h: 56, bg: '#707C65', edge: '#F6F8F3' },
];

const NOTCHES = [
  { top: '23.9%', w: 24, h: 46, edge: '#F6F8F3' },
  { top: '54.4%', w: 28, h: 48, edge: '#F6F8F3' },
  { top: '85.6%', w: 24, h: 46, edge: '#F6F8F3' },
];

const DOTS = [
  { top: '5%', size: 6, color: '#FCFAF7' },
  { top: '8.5%', size: 4, color: '#F6F8F3' },
  { top: '18.7%', size: 5, color: '#F6F8F3' },
  { top: '33.8%', size: 6, color: '#FCFAF7' },
  { top: '36.5%', size: 4, color: '#F6F8F3' },
  { top: '64%', size: 6, color: '#FCFAF7' },
  { top: '66.5%', size: 4, color: '#F6F8F3' },
  { top: '95%', size: 6, color: '#FCFAF7' },
  { top: '97%', size: 4, color: '#F6F8F3' },
];

const PUNCHES = [
  { label: 'IN', time: '09:00', top: '23.5%', dot: '#10b981', dark: false },
  { label: 'LUNCH', time: '13:00', top: '50%', dot: '#F6F8F3', dark: true },
  { label: 'OUT', time: '18:00', top: '80%', dot: '#f59e0b', dark: false },
];

function Seam() {
  return (
    <div className="hidden lg:block absolute top-0 right-0 h-full w-0 z-30 pointer-events-none select-none">
      <div className="absolute top-0 left-0 h-full w-6 bg-gradient-to-r from-[#2b3323]/10 to-transparent" />

      {TABS.map((t, i) => (
        <div
          key={`tab${i}`}
          className="absolute left-0 rounded-r-xl border-y border-r flex items-center justify-center shadow-[4px_2px_10px_rgba(30,35,25,0.18)]"
          style={{ top: t.top, width: t.w, height: t.h, background: t.bg, borderColor: t.edge }}
        >
          <span className="block w-3.5 h-1.5 rounded-full bg-white/90 -ml-1" />
        </div>
      ))}

      {NOTCHES.map((n, i) => (
        <div
          key={`notch${i}`}
          className="absolute right-0 rounded-l-xl border-y border-l flex items-center justify-center bg-[#FCFAF7]"
          style={{
            top: n.top,
            width: n.w,
            height: n.h,
            borderColor: n.edge,
            boxShadow: 'inset 3px 0 8px rgba(93,105,83,0.10)',
          }}
        >
          <span className="block w-3 h-1.5 rounded-full bg-[#9aa0b4]/80 -mr-0.5" />
        </div>
      ))}

      {DOTS.map((d, i) => (
        <span
          key={`dot${i}`}
          className="absolute rounded-full -translate-y-1/2"
          style={{ top: d.top, left: -12 - d.size / 2, width: d.size, height: d.size, background: d.color, opacity: 0.9 }}
        />
      ))}

      {PUNCHES.map((p) => (
        <div
          key={p.label}
          className={`absolute left-0 -translate-x-1/2 -translate-y-1/2 w-[58px] h-[58px] rounded-full flex flex-col items-center justify-center leading-none shadow-[0_6px_18px_rgba(30,35,25,0.25)] border ${
            p.dark ? 'bg-[#5D6953] border-[#F6F8F3]/40 text-white' : 'bg-white border-white text-[#1b1c1a]'
          }`}
          style={{ top: p.top }}
        >
          <span className="flex items-center gap-1 text-[8px] font-bold tracking-wide" style={{ color: p.dark ? '#F6F8F3' : '#5D6953' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.dot }} />
            {p.label}
          </span>
          <span className="mt-1 text-[11px] font-bold">{p.time}</span>
        </div>
      ))}
    </div>
  );
}

export default function EmployeeLoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [clock, setClock] = useState('--:--');
  const [day, setDay] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [today, setToday] = useState({ year: 2026, month: 10, day: 10 });
  const [view, setView] = useState({ year: 2026, month: 10 });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    const first = getISTComponents();
    const initializeView = setTimeout(() => {
      setView({ year: first.year, month: first.month });
    }, 0);

    const tick = () => {
      const ist = getISTComponents();
      setClock(`${ist.hour}:${ist.minute}`);
      setDay(ist.weekday);
      setDateStr(`${ist.day} ${MONTH_NAMES[ist.month]} ${ist.year}`);
      setToday({ year: ist.year, month: ist.month, day: ist.day });
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(initializeView);
      clearInterval(t);
    };
  }, []);

  const prevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  const nextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));

  const firstDay = new Date(view.year, view.month, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset === -1) startOffset = 6;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const daysInPrev = new Date(view.year, view.month, 0).getDate();
  const isCurrentMonth = view.year === today.year && view.month === today.month;
  const extraCells = (7 - ((startOffset + daysInMonth) % 7)) % 7;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    
    // EXACT ORIGINAL LOGIC
    const result = await dispatch(login({ email: employeeId.trim(), password }));
    if (result.success) {
      setStatus('success');
      router.push('/dashboard');
    } else {
      setStatus('idle');
      setError(result.message || 'Login failed');
    }
  };

  const inputBase =
    'w-full h-11 sm:h-12 rounded-xl bg-[#FCFAF7] hover:bg-[#F4EFE6] border border-[#E5DDCE] focus:border-[#707C65] focus:bg-white text-sm text-[#1b1c1a] placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-[#707C65]/15 transition-all shadow-sm';

  return (
    <div
      className="min-h-screen bg-[#FBF7F0] text-[#1b1c1a] relative flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-x-hidden selection:bg-[#EAF0E6] selection:text-[#46513F]"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Organic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#848F76]/15 to-[#E3BF96]/15 blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-[#C85D44]/10 via-[#D9B288]/10 to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="relative w-full rounded-[1.75rem] sm:rounded-[2.5rem] shadow-[0_24px_64px_rgba(72,60,45,0.12)] overflow-hidden bg-[#FCFAF7] border border-[#ECE3D3]/80 flex flex-col lg:flex-row lg:min-h-[712px]">
          
          {/* ================= LEFT PANEL ================= */}
          <section className="relative z-20 lg:w-[49%] shrink-0 bg-gradient-to-br from-[#4E5A45] via-[#5D6953] to-[#707C65] text-white p-6 sm:p-10 lg:pl-12 lg:pr-14 lg:py-12 flex flex-col">
            <Seam />

            <div className="inline-flex self-start items-center p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <span
                className="bg-[#0b4fc4] text-white text-xs sm:text-sm font-bold tracking-wide pl-3 pr-5 py-1 uppercase"
                style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)' }}
              >
                NANDGATE-IT
              </span>
            </div>

            <div className="mt-8 sm:mt-12 lg:mt-16">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.2]">
                Streamline Your Daily <span className="text-[#D9E2D2]">Attendance</span> &amp; Presence.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
                Effortless punch-in, smart shift management, real-time presence tracking, and automated work logs.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
              {PUNCHES.map((p) => (
                <span
                  key={p.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                    p.dark ? 'bg-[#5D6953] border border-[#F6F8F3]/40 text-white' : 'bg-white text-[#1b1c1a]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.dot }} />
                  <span style={{ color: p.dark ? '#F6F8F3' : '#5D6953' }}>{p.label}</span>
                  {p.time}
                </span>
              ))}
            </div>

            <div className="mt-8 lg:mt-auto lg:pt-10 lg:pb-8">
              <div className="flex items-end justify-between gap-3 pb-3 border-b border-white/20">
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight">{day}</div>
                  <div className="text-xs sm:text-sm text-white/70 font-medium mt-0.5">{dateStr}</div>
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none tabular-nums">{clock}</div>
              </div>

              <div className="mt-5 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D9E2D2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {MONTH_NAMES[view.month]} {view.year}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={prevMonth} aria-label="Previous month" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition active:scale-95">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button type="button" onClick={nextMonth} aria-label="Next month" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition active:scale-95">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-white/60 py-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center text-xs sm:text-sm items-center">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <span key={`p${i}`} className="h-9 sm:h-[38px] flex items-center justify-center text-white/30">
                    {daysInPrev - (startOffset - 1 - i)}
                  </span>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isToday = isCurrentMonth && d === today.day;
                  return (
                    <span key={`c${d}`} className="h-9 sm:h-[38px] flex items-center justify-center">
                      {isToday ? (
                        <span className="w-8 h-8 rounded-full bg-[#C87961] text-white font-extrabold flex items-center justify-center shadow-md">
                          {d}
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 font-medium hover:bg-white/15 cursor-pointer transition-colors">
                          {d}
                        </span>
                      )}
                    </span>
                  );
                })}

                {Array.from({ length: extraCells }).map((_, i) => (
                  <span key={`n${i}`} className="h-9 sm:h-[38px] flex items-center justify-center text-white/30">
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ================= RIGHT PANEL ================= */}
          <section className="relative z-10 flex-1 bg-[#FCFAF7] p-6 sm:p-10 lg:pl-16 lg:pr-12 flex items-center">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-[#EAF0E6]/10 to-[#FAEEE5]/10" />
            <div className="relative w-full max-w-[420px] mx-auto space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#5D6953]" style={{ fontFamily: "'EB Garamond', serif" }}>Clock In &amp; Sign In</h2>
                <p className="mt-2 text-base text-stone-600 leading-relaxed">
                  Enter your employee credentials to mark attendance and access your portal.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-stone-700" htmlFor="employee-id">
                    Employee ID or Work Email
                  </label>
                  <div className="relative flex items-center">
                    <svg className="absolute left-4 w-5 h-5 text-[#707C65] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <input
                      id="employee-id"
                      type="text"
                      required
                      autoComplete="username"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP-1042 or work email"
                      className={`${inputBase} pl-12 pr-4`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-stone-700" htmlFor="employee-pin">
                      Security PIN or Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowChangePassword(true)}
                      className="text-sm font-bold text-[#C87961] hover:text-[#B86A54] hover:underline"
                    >
                      Change password
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <svg className="absolute left-4 w-5 h-5 text-[#707C65] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      id="employee-pin"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputBase} pl-12 pr-12 placeholder:text-stone-400`}
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-4 text-stone-400 hover:text-[#5D6953] transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm font-bold text-[#B24832] bg-[#FAEEE5] px-4 py-2.5 rounded-lg border border-[#F3D7CB]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={`w-full h-12 sm:h-[52px] px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 ${
                    status === 'success' ? 'bg-[#5D6953]' : 'bg-[#C87961] hover:bg-[#B86A54]'
                  }`}
                >
                  <span>
                    {status === 'loading'
                      ? 'Logging in...'
                      : status === 'success'
                      ? 'Logged In • Welcome!'
                      : 'Sign In & Clock In'}
                  </span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#ECE3D3]" />
                <span className="absolute px-3 bg-[#FCFAF7] text-xs font-bold text-stone-400 uppercase tracking-widest">Or sign in with</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-[#FCFAF7] hover:bg-[#F4EFE6] text-sm font-bold transition border border-[#E5DDCE] text-stone-700 shadow-sm">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Google</span>
                </button>

                <button type="button" className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-[#FCFAF7] hover:bg-[#F4EFE6] text-sm font-bold transition border border-[#E5DDCE] text-stone-700 shadow-sm">
                  <svg className="w-5 h-5 text-stone-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    {[6, 12, 18].flatMap((cy) => [6, 12, 18].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" />))}
                  </svg>
                  <span>Phone PIN</span>
                </button>
              </div>

              <div className="text-center text-sm font-medium text-stone-500">
                Don&apos;t have an account?{' '}
                <a className="font-bold text-[#5D6953] hover:underline" href="#signup">
                  Sign up
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  );
}