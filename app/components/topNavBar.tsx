'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { performLogout } from '../store/auth/authSlice';
import ChangePasswordDialog from './ChangePasswordDialog';
import {
  fetchMyNotifications,
  fetchMyUnreadNotificationCount,
  getNotificationHref,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../store/notifications/notificationSlice';

export type NavId =
  | 'home'
  | 'attendance'
  | 'request'
  | 'payslip'
  | 'holiday'
  | 'profile';

interface TopNavProps {
  active?: NavId;
  onChange?: (id: NavId) => void;
  user?: {
    name: string;
    initials: string;
    empId: string;
    role: string;
    email: string;
  };
}

interface NavItemConfig {
  id: NavId;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', href: '/dashboard' },
  { id: 'attendance', label: 'Attendance', href: '/attendance' },
  { id: 'request', label: 'Request', href: '/requests' },
  { id: 'payslip', label: 'Payslip', href: '/payslip' },
  { id: 'holiday', label: 'Holiday', href: '/holiday' },
  { id: 'profile', label: 'Profile', href: '/profile' },
];

const DEFAULT_USER = {
  name: 'Sarah Jenkins',
  initials: 'SJ',
  empId: '#NG-429',
  role: 'UX Designer',
  email: 'sarah.jenkins@nandgate.io',
};

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

const HomeIcon = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const icons: Record<Exclude<NavId, 'home'>, (className: string) => React.ReactNode> = {
  attendance: (c) => (
    <svg className={c} {...stroke}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  ),
  request: (c) => (
    <svg className={c} {...stroke}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  payslip: (c) => (
    <svg className={c} {...stroke}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  holiday: (c) => (
    <svg className={c} {...stroke}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  profile: (c) => (
    <svg className={c} {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0l.06.06a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

// Framer motion spring physics configs
const notchSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
  mass: 0.85,
};

const trailSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
  mass: 1.1,
};

function getNavShape(activeCenter: number) {
  return `
    M 38 18
    C 17 18 0 35 0 56
    C 0 68 10 76 26 76
    H 754
    C 768 76 780 68 780 56
    C 780 35 763 18 742 18
    H ${activeCenter + 58}
    C ${activeCenter + 50} 18 ${activeCenter + 43} 23 ${activeCenter + 39} 29
    C ${activeCenter + 30} 43 ${activeCenter + 16} 52 ${activeCenter} 52
    C ${activeCenter - 16} 52 ${activeCenter - 30} 43 ${activeCenter - 39} 29
    C ${activeCenter - 43} 23 ${activeCenter - 50} 18 ${activeCenter - 58} 18
    Z
  `;
}

export default function TopNav({
  active,
  onChange,
  user = DEFAULT_USER,
}: TopNavProps) {
  const pathname = usePathname() || '/dashboard';
  const dispatch = useAppDispatch();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markingReadIds,
    markingAllRead,
  } = useAppSelector((state) => state.notifications);

  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await dispatch(performLogout());
      window.location.replace('/login');
    } catch (error: unknown) {
      console.error('Unable to log out:', error);
      window.alert('Unable to log out. Please try again.');
    }
  };

  useEffect(() => {
    void dispatch(fetchMyUnreadNotificationCount());
  }, [dispatch]);

  // Determine active tab automatically from URL or explicit prop
  const detectedActiveId = useMemo(() => {
    if (active) return active;
    if (pathname === '/' || pathname.startsWith('/dashboard')) return 'home';
    const found = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    return found ? found.id : 'home';
  }, [active, pathname]);

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === detectedActiveId)
  );
  const activeItem = NAV_ITEMS[activeIndex];

  // SVG total width = 780 units across 6 tabs = 130 per tab
  const activeCenter = (activeIndex + 0.5) * 130;
  const currentNavShape = useMemo(() => getNavShape(activeCenter), [activeCenter]);

  // Handle outside clicks
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header className="relative z-50 w-full select-none pb-2">
      <div className="flex items-center justify-between gap-3 lg:gap-5">

        {/* 1. Left: Workspace Brand Pill */}
        <Link
          href="/dashboard"
          aria-label="NANDGATE-IT dashboard"
          className="inline-flex shrink-0 items-center gap-3 rounded-2xl bg-[#5D6953] px-4 py-2.5 text-white shadow-sm transition hover:bg-[#4d5744]"
        >
          <div className="flex h-5 w-5 items-center justify-center text-white/80 transition hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-extrabold tracking-widest text-[#D8DEC7] uppercase">
              WORKSPACE
            </span>
            <span className="text-xs font-black tracking-wider text-white sm:text-sm">
              NANDGATE-IT
            </span>
          </div>
        </Link>

        {/* 2. Center: Dynamic Notched Navigation with Glow Trail */}
        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden w-full min-w-0 max-w-[820px] flex-1 drop-shadow-[0_8px_20px_rgba(70,78,63,0.08)] md:block"
        >
          <div className="relative h-[82px]">

            {/* Trailing Shadow Glow Layer */}
            <motion.div
              key={activeIndex}
              className="pointer-events-none absolute -top-1 h-[68px] w-[80px] -translate-x-1/2 rounded-full"
              initial={{ opacity: 0.65, scale: 1.28 }}
              animate={{
                left: `${((activeIndex + 0.5) / 6) * 100}%`,
                opacity: 0.2,
                scale: 1,
              }}
              transition={{
                left: trailSpring,
                opacity: { duration: 0.2 },
                scale: { type: 'tween', duration: 0.45, ease: 'easeOut' },
              }}
            >
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#707C65]/30 via-[#DDB892]/40 to-[#C85D44]/30 blur-xl" />
            </motion.div>

            {/* Morphing SVG Notch Path */}
            <svg
              className="absolute inset-0 h-full w-full text-white"
              viewBox="0 0 780 76"
              preserveAspectRatio="none"
              fill="currentColor"
              aria-hidden="true"
            >
              <motion.path
                d={currentNavShape}
                animate={{ d: currentNavShape }}
                transition={notchSpring}
              />
            </svg>

            {/* Inactive & Hover Links (Next.js Link navigation) */}
            <div className="absolute inset-x-0 bottom-0 top-[18px] grid grid-cols-6 items-end pb-2">
              {NAV_ITEMS.map((item) => {
                const isActive = detectedActiveId === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onChange?.(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex flex-col items-center justify-center
                      transition-all duration-200 active:scale-95
                      ${isActive ? 'invisible pointer-events-none' : 'group text-[#8C9781] hover:text-[#5D6953]'}
                    `}
                  >
                    {item.id === 'home' ? (
                      <HomeIcon className="mb-0.5 h-4 w-4 transition-transform group-hover:scale-110" />
                    ) : (
                      icons[item.id]('mb-0.5 h-4 w-4 transition-transform group-hover:scale-110')
                    )}
                    <span className="text-xs font-semibold tracking-wide transition-colors group-hover:font-bold">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Elevated Active Circle with Concentric Glow */}
            <motion.div
              className="absolute -top-[4px] -translate-x-1/2"
              animate={{ left: `${((activeIndex + 0.5) / 6) * 100}%` }}
              transition={notchSpring}
            >
              <motion.div
                key={activeIndex}
                className="pointer-events-none absolute inset-[-6px] -z-10 rounded-full"
                initial={{ boxShadow: '0 0 28px 6px rgba(112, 124, 101, 0.45), 0 0 14px 3px rgba(200, 93, 68, 0.28)', scale: 1.14 }}
                animate={{
                  boxShadow: '0 0 16px 2px rgba(112, 124, 101, 0.16)',
                  scale: 1,
                }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              />

              <Link
                href={activeItem.href}
                aria-label={`Current page: ${activeItem.label}`}
                onClick={() => onChange?.(activeItem.id)}
                className="
                  relative flex h-[56px] w-[56px]
                  items-center justify-center
                  rounded-full
                  border-[3px] border-[#ECE3D3]
                  bg-white
                  text-[#5D6953]
                  shadow-[0_8px_20px_rgba(70,78,63,0.22)]
                  transition-all duration-200
                  hover:scale-105 active:scale-95
                "
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, scale: 0.65, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.65, rotate: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeItem.id === 'home' ? (
                      <HomeIcon className="h-5 w-5" />
                    ) : (
                      icons[activeItem.id]('h-5 w-5')
                    )}
                  </motion.div>
                </AnimatePresence>
              </Link>
            </motion.div>

            {/* Active Tab Label */}
            <motion.span
              animate={{ left: `${((activeIndex + 0.5) / 6) * 100}%` }}
              transition={notchSpring}
              className="
                pointer-events-none absolute bottom-[2px]
                -translate-x-1/2 whitespace-nowrap
                text-xs font-black tracking-wide text-[#4D5844]
              "
            >
              {activeItem.label}
            </motion.span>
          </div>
        </nav>

        {/* 3. Right: Notifications Bell & Profile Trigger */}
        <div className="flex shrink-0 items-center justify-end gap-3">
          
          {/* Notifications Trigger & Modal */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              title="Notifications"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              onClick={() => {
                const opening = !notificationsOpen;
                setNotificationsOpen(opening);
                if (opening) void dispatch(fetchMyNotifications());
              }}
              className="
                relative flex h-11 w-11 items-center justify-center
                rounded-full border border-[#ECE3D3]
                bg-white text-stone-700 shadow-sm
                transition-all hover:bg-stone-50 active:scale-95
              "
            >
              <svg className="h-[19px] w-[19px]" {...stroke}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5 rounded-full bg-[#C85D44] ring-2 ring-white">
                  <span className="sr-only">{unreadCount} unread</span>
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section
                role="dialog"
                aria-label="Notifications"
                className="absolute right-[-76px] z-[60] mt-3 flex max-h-[min(600px,calc(100dvh-120px))] w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#E8E1D5] bg-white shadow-[0_24px_50px_rgba(50,56,44,0.18)] ring-4 ring-black/5"
              >
                <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E8E1D5] bg-[#F7F3EB] px-5 py-4">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">Notifications</h2>
                    <p className="mt-0.5 text-xs font-semibold text-[#707C65]">
                      {unreadCount} unread
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Refresh notifications"
                      aria-label="Refresh notifications"
                      onClick={() => {
                        void dispatch(fetchMyNotifications());
                        void dispatch(fetchMyUnreadNotificationCount());
                      }}
                      disabled={notificationsLoading}
                      className="rounded-lg p-2 text-stone-500 transition hover:bg-[#EFE9DF] hover:text-[#5D6953] disabled:opacity-50"
                    >
                      <svg className={`h-4 w-4 ${notificationsLoading ? 'animate-spin' : ''}`} {...stroke}>
                        <path d="M20 7v5h-5" />
                        <path d="M4 17v-5h5" />
                        <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void dispatch(markAllNotificationsAsRead()).then((result) => {
                          if (markAllNotificationsAsRead.fulfilled.match(result)) {
                            void dispatch(fetchMyUnreadNotificationCount());
                          }
                        });
                      }}
                      disabled={unreadCount === 0 || markingAllRead}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#5D6953] transition hover:bg-[#EDE7DC] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-3.5 w-3.5" {...stroke}>
                        <path d="m5 12 4 4L19 6" />
                        <path d="m2 12 4 4" />
                      </svg>
                      {markingAllRead ? 'Marking...' : 'Mark all read'}
                    </button>
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {notificationsLoading && notifications.length === 0 ? (
                    <p className="px-5 py-8 text-center text-xs text-stone-500">Loading notifications...</p>
                  ) : notificationsError ? (
                    <div className="px-4 py-6 text-center">
                      <p role="alert" className="text-xs text-rose-600">{notificationsError}</p>
                      <button
                        type="button"
                        onClick={() => void dispatch(fetchMyNotifications())}
                        className="mt-2 text-xs font-semibold text-[#5D6953] hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="px-5 py-8 text-center text-xs text-stone-500">You&apos;re all caught up.</p>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <article
                        key={notification.id}
                        className={`border-b border-l-4 border-b-stone-100 px-5 py-3.5 last:border-b-0 ${
                          notification.is_read ? 'border-l-transparent bg-white' : 'border-l-[#707C65] bg-[#F6F8F3]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              notification.is_read ? 'bg-stone-300' : 'bg-[#707C65] ring-2 ring-[#D9E2D2]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={getNotificationHref(notification)}
                              onClick={() => setNotificationsOpen(false)}
                              className="block rounded-sm hover:text-[#5D6953] focus-visible:outline-2 focus-visible:outline-[#5D6953]"
                            >
                              <h3 className="break-words text-sm font-bold text-stone-900">{notification.title}</h3>
                              <p className="mt-1 line-clamp-2 break-words text-xs text-stone-600">{notification.message}</p>
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#707C65]">
                                {notification.type.replaceAll('_', ' ')} ·{' '}
                                {new Intl.DateTimeFormat('en', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }).format(new Date(notification.created_at))}
                              </span>
                              {!notification.is_read && (
                                <button
                                  type="button"
                                  onClick={() => void dispatch(markNotificationAsRead(notification.id))}
                                  disabled={markingReadIds.includes(notification.id) || markingAllRead}
                                  className="text-xs font-semibold text-[#5D6953] hover:underline disabled:opacity-50"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <footer className="shrink-0 border-t border-[#E8E1D5] bg-[#FAF7F0] px-5 py-3 text-right">
                  <Link
                    href="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-[#5D6953] hover:underline"
                  >
                    View all notifications
                  </Link>
                </footer>
              </section>
            )}
          </div>

          {/* User Profile Capsule Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="
                flex items-center gap-2.5 rounded-full
                border border-[#ECE3D3] bg-white
                px-3 py-1.5 shadow-sm
                transition hover:bg-stone-50 active:scale-95
              "
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAEEE5] text-xs font-black text-[#C85D44]">
                {user.initials}
              </div>

              <div className="hidden flex-col text-left sm:flex">
                <span className="text-xs font-bold leading-tight text-stone-900">{user.name}</span>
                <span className="text-[11px] leading-tight text-stone-500">{user.role}</span>
              </div>

              <svg
                className={`h-4 w-4 text-stone-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-[#E8E1D5] bg-white py-2 shadow-xl">
                <div className="border-b border-stone-100 px-4 py-2.5">
                  <p className="text-sm font-bold text-stone-900">{user.name}</p>
                  <p className="text-xs text-[#707C65]">{user.empId} · {user.role}</p>
                </div>

                <div className="px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setPasswordDialogOpen(true);
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold text-stone-700 hover:bg-[#F7F3EB] hover:text-[#5D6953] transition-colors"
                  >
                    Change Password
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleLogout();
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold text-[#C85D44] hover:bg-[#FAEEE5] transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs (Next.js Links) */}
      <nav aria-label="Mobile navigation" className="mt-3 flex gap-1.5 overflow-x-auto border-t border-[#707C65]/20 pt-3 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = detectedActiveId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onChange?.(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                isActive ? 'bg-[#5D6953] text-white shadow-sm' : 'text-stone-600 hover:bg-[#EFE9DF] hover:text-[#5D6953]'
              }`}
            >
              {item.id === 'home' ? (
                <HomeIcon className="h-4 w-4" />
              ) : (
                icons[item.id]('h-4 w-4')
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {passwordDialogOpen && <ChangePasswordDialog onClose={() => setPasswordDialogOpen(false)} />}
    </header>
  );
}