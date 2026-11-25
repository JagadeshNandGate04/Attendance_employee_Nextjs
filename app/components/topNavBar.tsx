'use client';

import React, { useEffect, useRef, useState, useMemo, useSyncExternalStore } from 'react';
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

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

// Created once and reused for every notification row
const notificationDateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

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
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const visibleUnreadCount = isHydrated ? unreadCount : 0;

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
          className="inline-flex shrink-0 items-center gap-3.5 rounded-2xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] px-5 py-3 text-white shadow-md ring-1 ring-black/5 transition hover:from-[#4d5744] hover:to-[#363F31]"
        >
          <div className="flex h-6 w-6 items-center justify-center text-white/80 transition hover:text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D8DEC7]">
              WORKSPACE
            </span>
            <span className="text-base font-black tracking-wider text-white sm:text-lg">
              NANDGATE-IT
            </span>
          </div>
        </Link>

        {/* 2. Center: Dynamic Notched Navigation with Glow Trail */}
        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden w-full min-w-0 max-w-[860px] flex-1 drop-shadow-[0_8px_20px_rgba(70,78,63,0.08)] md:block"
        >
          <div className="relative h-[88px]">

            {/* Trailing Shadow Glow Layer */}
            <motion.div
              key={activeIndex}
              className="pointer-events-none absolute -top-1 h-[72px] w-[84px] -translate-x-1/2 rounded-full"
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
            <div className="absolute inset-x-0 bottom-0 top-[20px] grid grid-cols-6 items-end pb-2.5">
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
                      ${isActive ? 'invisible pointer-events-none' : 'group text-[#707C65] hover:text-[#414B3A]'}
                    `}
                  >
                    {item.id === 'home' ? (
                      <HomeIcon className="mb-1 h-5 w-5 transition-transform group-hover:scale-110" />
                    ) : (
                      icons[item.id]('mb-1 h-5 w-5 transition-transform group-hover:scale-110')
                    )}
                    <span className="text-sm font-bold tracking-wide transition-colors sm:text-base">
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
                  relative flex h-[60px] w-[60px]
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
                      <HomeIcon className="h-6 w-6" />
                    ) : (
                      icons[activeItem.id]('h-6 w-6')
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
                pointer-events-none absolute bottom-[3px]
                -translate-x-1/2 whitespace-nowrap
                text-sm font-black tracking-wide text-[#414B3A] sm:text-base
              "
            >
              {activeItem.label}
            </motion.span>
          </div>
        </nav>

        {/* 3. Right: Notifications Bell & Profile Trigger */}
        {/* `relative` here lets the notification panel align to the right edge of this group */}
        <div className="relative flex shrink-0 items-center justify-end gap-3">

          {/* Notifications Trigger & Compact Panel */}
          <div ref={notificationsRef}>
            <button
              type="button"
              title="Notifications"
              aria-label={`Notifications${visibleUnreadCount ? `, ${visibleUnreadCount} unread` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              onClick={() => {
                const opening = !notificationsOpen;
                setNotificationsOpen(opening);
                if (opening) void dispatch(fetchMyNotifications());
              }}
              className="
                relative flex h-14 w-14 items-center justify-center
                rounded-full border border-[#E5DDCE]
                bg-white text-[#414B3A] shadow-sm
                transition-all hover:border-[#707C65] hover:bg-[#F6F8F3] active:scale-95
              "
            >
              <svg className="h-6 w-6" {...stroke}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {visibleUnreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1.5 -top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full border-[3px] border-[#FCFAF7] bg-[#C87961] px-1.5 text-sm font-black tabular-nums text-white shadow-md"
                >
                  {visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full z-[60] mt-2.5 flex max-h-[min(520px,calc(100dvh-120px))] w-[min(384px,calc(100vw-3.5rem))] flex-col overflow-hidden rounded-2xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-[0_16px_40px_rgba(50,56,44,0.2)] ring-2 ring-black/5"
              >
                {/* Panel header */}
                <header className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-[#E5DDCE] bg-gradient-to-r from-[#F7F3EB] to-[#F2EEE5] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
                      <svg className="h-5 w-5" {...stroke}>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <div>
                      <h2 className="text-lg font-black leading-tight text-stone-900">Notifications</h2>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#46513F]">
                        <span className="rounded-full bg-[#C87961] px-2 py-px text-[11px] font-black tabular-nums text-white">
                          {visibleUnreadCount}
                        </span>
                        unread
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Refresh notifications"
                      aria-label="Refresh notifications"
                      onClick={() => {
                        void dispatch(fetchMyNotifications());
                        void dispatch(fetchMyUnreadNotificationCount());
                      }}
                      disabled={notificationsLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D9E2D2] bg-[#F6F8F3] text-[#46513F] transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 disabled:opacity-50"
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
                      className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#C87961] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" {...stroke}>
                        <path d="m5 12 4 4L19 6" />
                        <path d="m2 12 4 4" />
                      </svg>
                      {markingAllRead ? 'Marking...' : 'Mark all read'}
                    </button>
                  </div>
                </header>

                {/* Notification list */}
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-2.5">
                  {notificationsLoading && notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm font-bold text-[#5D6953]">Loading notifications...</p>
                  ) : notificationsError ? (
                    <div className="rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] px-4 py-5 text-center">
                      <p role="alert" className="text-sm font-bold text-[#B24832]">{notificationsError}</p>
                      <button
                        type="button"
                        onClick={() => void dispatch(fetchMyNotifications())}
                        className="mt-2.5 rounded-lg bg-[#C87961] px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95"
                      >
                        Try again
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E5DDCE] bg-white px-4 py-8 text-center">
                      <p className="text-base font-black text-stone-800">You&apos;re all caught up</p>
                      <p className="mt-0.5 text-sm text-stone-500">New notifications will appear here.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <article
                        key={notification.id}
                        className={`relative rounded-xl border border-l-4 p-3 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-[#5D6953]/40 ${
                          notification.is_read
                            ? 'border-[#ECE3D3] border-l-[#D9D2C3] bg-white'
                            : 'border-[#BCC7B4] border-l-[#5D6953] bg-[#F6F8F3]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            aria-hidden="true"
                            className={`mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full ${
                              notification.is_read ? 'bg-stone-300' : 'bg-[#C85D44] ring-[3px] ring-[#F4C8B9]/60'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            {/* Title row: the title link stretches over the whole card; Mark read sits above it */}
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className={`min-w-0 flex-1 break-words text-[15px] leading-snug tracking-tight ${
                                  notification.is_read ? 'font-bold text-stone-700' : 'font-black text-[#2F3A2A]'
                                }`}
                              >
                                <Link
                                  href={getNotificationHref(notification)}
                                  onClick={() => setNotificationsOpen(false)}
                                  className="outline-none after:absolute after:inset-0 after:content-[''] hover:underline"
                                >
                                  {notification.title}
                                </Link>
                              </h3>
                              {!notification.is_read && (
                                <button
                                  type="button"
                                  onClick={() => void dispatch(markNotificationAsRead(notification.id))}
                                  disabled={markingReadIds.includes(notification.id) || markingAllRead}
                                  className="relative z-10 -mt-1 inline-flex h-7 shrink-0 items-center rounded-lg bg-[#C87961] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>

                            <p className="mt-1.5 line-clamp-2 break-words rounded-lg border border-[#ECE3D3] bg-white/80 px-2.5 py-1.5 text-[13px] leading-5 text-stone-500">
                              {notification.message}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-stone-500">
                              <span className="rounded-full border border-[#D9E2D2] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#5D6953]">
                                {notification.type.replaceAll('_', ' ')}
                              </span>
                              <time dateTime={notification.created_at}>
                                {notificationDateFormat.format(new Date(notification.created_at))}
                              </time>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                {/* Panel footer */}
                <footer className="shrink-0 border-t border-[#E5DDCE] bg-[#FAF7F0] p-2.5">
                  <Link
                    href="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex w-full items-center justify-center rounded-xl border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-2 text-sm font-bold text-[#46513F] transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95"
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
                flex items-center gap-3 rounded-full
                border border-[#E5DDCE] bg-white
                py-2 pl-2.5 pr-4 shadow-sm
                transition hover:border-[#707C65] hover:bg-[#F6F8F3] active:scale-95
              "
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAEEE5] text-base font-black text-[#C85D44]">
                {user.initials}
              </div>

              <div className="hidden flex-col text-left sm:flex">
                <span className="text-base font-bold leading-tight text-stone-900">{user.name}</span>
                <span className="text-sm leading-tight text-stone-500">{user.role}</span>
              </div>

              <svg
                className={`h-5 w-5 text-stone-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-[0_24px_50px_rgba(50,56,44,0.18)]">
                <div className="border-b border-[#E5DDCE] bg-gradient-to-r from-[#F7F3EB] to-[#F2EEE5] px-5 py-4">
                  <p className="text-lg font-black text-stone-900">{user.name}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#707C65]">{user.empId} · {user.role}</p>
                </div>

                <div className="space-y-1.5 p-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setPasswordDialogOpen(true);
                    }}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-base font-bold text-stone-700 transition-colors hover:bg-[#F6F8F3] hover:text-[#5D6953]"
                  >
                    Change Password
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleLogout();
                    }}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-base font-bold text-[#C85D44] transition-colors hover:bg-[#FAEEE5]"
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
      <nav aria-label="Mobile navigation" className="mt-3 flex gap-2 overflow-x-auto border-t border-[#707C65]/20 pt-3 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = detectedActiveId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onChange?.(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                isActive ? 'bg-[#5D6953] text-white shadow-sm' : 'text-stone-600 hover:bg-[#EFE9DF] hover:text-[#5D6953]'
              }`}
            >
              {item.id === 'home' ? (
                <HomeIcon className="h-5 w-5" />
              ) : (
                icons[item.id]('h-5 w-5')
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