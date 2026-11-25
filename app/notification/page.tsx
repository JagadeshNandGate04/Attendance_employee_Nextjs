"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Inbox, Megaphone, RefreshCw } from "lucide-react";
import TopNav from "../components/topNavBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchMyNotifications,
  fetchMyUnreadNotificationCount,
  getNotificationHref,
  isAnnouncementNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../store/notifications/notificationSlice";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

// Shared button styles (same palette as the Attendance page)
const actionBtn =
  "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border border-[#C87961] bg-[#C87961] px-5 py-2.5 text-base font-bold text-white shadow-sm transition hover:border-[#B86A54] hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const scrolledHash = useRef("");
  const {
    notifications,
    pagination,
    unreadCount,
    unreadCountError,
    loading,
    error,
    markingReadIds,
    markingAllRead,
    actionError,
  } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    void dispatch(fetchMyNotifications());
    void dispatch(fetchMyUnreadNotificationCount());
  }, [dispatch]);

  useEffect(() => {
    const hash = window.location.hash;
    if (loading || !hash || scrolledHash.current === hash) return;
    const notification = notifications.find(
      (item) => hash === `#notification-${encodeURIComponent(item.id)}`
    );
    if (!notification) return;
    document.getElementById(`notification-${notification.id}`)?.scrollIntoView({ block: "center" });
    scrolledHash.current = hash;
  }, [loading, notifications]);

  const refreshNotifications = () => {
    void dispatch(fetchMyNotifications());
    void dispatch(fetchMyUnreadNotificationCount());
  };

  const handleMarkRead = (id: string) => {
    void dispatch(markNotificationAsRead(id));
  };

  const handleMarkAllRead = () => {
    void dispatch(markAllNotificationsAsRead()).then((result) => {
      if (markAllNotificationsAsRead.fulfilled.match(result)) {
        void dispatch(fetchMyUnreadNotificationCount());
      }
    });
  };

  // Display-only counts for the summary cards
  const totalCount = pagination?.total ?? notifications.length;
  const announcementCount = notifications.filter((item) => isAnnouncementNotification(item)).length;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] p-3 font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white sm:p-5 md:p-7 lg:p-9">
      {/* Organic backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
        <svg
          className="h-full w-full object-cover opacity-90"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z" fill="#848F76" />
          <path d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z" fill="#E3BF96" />
          <path d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z" fill="#C85D44" />
          <path d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z" fill="#D9B288" />
          <path d="M -60 500 C 320 410, 760 630, 1120 430 C 1470 230, 1740 330, 2040 190" stroke="#707C65" strokeWidth="1.5" strokeOpacity="0.35" fill="none" />
          <path d="M 260 -60 C 440 330, 310 800, 720 970 C 1130 1140, 1600 900, 1980 1140" stroke="#C85D44" strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1580px] flex-col gap-5 rounded-[36px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:rounded-[42px] sm:p-6 lg:p-8">
        <TopNav active="home" />

        <main className="flex w-full flex-col gap-5">
          {/* Page header */}
          <header className="mt-2 flex flex-col gap-5 border-b border-[#ECE3D3] pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] text-white shadow-md ring-1 ring-black/5">
                <Bell className="h-10 w-10" aria-hidden="true" />
                <span
                  className={`absolute -right-2.5 -top-2.5 flex h-9 min-w-9 items-center justify-center rounded-full border-[3px] border-[#FCFAF7] px-2 text-base font-black tabular-nums text-white shadow-md ${
                    unreadCount > 0 ? "bg-[#C87961]" : "bg-[#9AA58F]"
                  }`}
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </span>
              <div>
                <span className="text-sm font-black uppercase tracking-widest text-[#5D6953]">
                  INBOX &amp; ALERTS
                </span>
                <h1 className="mt-0.5 text-4xl font-black text-stone-900 sm:text-5xl">
                  Notifications
                </h1>
                <p className="mt-1.5 text-base leading-relaxed text-stone-600 sm:text-lg">
                  Stay on top of approvals, corrections, and company announcements.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshNotifications}
                disabled={loading}
                className="inline-flex min-h-14 items-center gap-3 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-6 py-3 text-lg font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-5 w-5 text-[#707C65] ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markingAllRead}
                className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-[#C87961] px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="h-5 w-5" />
                {markingAllRead ? "Marking..." : "Mark all as read"}
              </button>
            </div>
          </header>

          {/* Errors */}
          {(actionError || unreadCountError) && (
            <div className="space-y-3">
              {actionError && (
                <div role="alert" className="rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4 text-base font-bold text-[#C85D44] sm:text-lg">
                  {actionError}
                </div>
              )}
              {unreadCountError && (
                <div role="alert" className="rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4 text-base font-bold text-[#C85D44] sm:text-lg">
                  {unreadCountError}
                </div>
              )}
            </div>
          )}

          {/* Summary cards (Attendance palette) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex min-h-44 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#E8EEDF]">
                  UNREAD
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Bell className="h-6 w-6" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C87961] px-1.5 text-xs font-black tabular-nums text-white ring-2 ring-[#5D6953]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-4xl font-black tabular-nums text-white">{unreadCount}</p>
                <p className="mt-1 text-base text-[#DCE4D5]">
                  {unreadCount === 1 ? "notification needs" : "notifications need"} your attention
                </p>
              </div>
            </div>

            <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#E8D4B9] bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="rounded-lg border border-[#EDD7BE] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#815526]">
                  TOTAL
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6E4C8] text-[#9B6A38]">
                  <Inbox className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#9B6A38] px-1.5 text-xs font-black tabular-nums text-white ring-2 ring-[#FBF1E2]">
                    {totalCount > 99 ? "99+" : totalCount}
                  </span>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-4xl font-black tabular-nums text-stone-900">{totalCount}</p>
                <p className="mt-1 text-base text-stone-600">Notifications in your inbox</p>
              </div>
            </div>

            <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#F3C9BB] bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="rounded-lg border border-[#F4C8B9] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#B24832]">
                  ANNOUNCEMENTS
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBE5DC] text-[#C85D44]">
                  <Megaphone className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C85D44] px-1.5 text-xs font-black tabular-nums text-white ring-2 ring-[#FEF1EC]">
                    {announcementCount > 99 ? "99+" : announcementCount}
                  </span>
                </span>
              </div>
              <div className="mt-4">
                <p className="text-4xl font-black tabular-nums text-[#B24832]">{announcementCount}</p>
                <p className="mt-1 text-base text-stone-600">Important announcements</p>
              </div>
            </div>
          </div>

          {/* Notification list card */}
          <section
            aria-label="Notification list"
            className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-md"
          >
            {/* List header bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DDCE] bg-gradient-to-r from-white to-[#FAF7F0] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm">
                  <Inbox className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900 sm:text-2xl">All notifications</h2>
                  <p className="mt-0.5 text-sm text-stone-600 sm:text-base">
                    Newest first. Select a notification to open it.
                  </p>
                </div>
              </div>
              <span className="rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-2 text-base font-bold text-[#46513F]">
                <span className="font-black text-[#C85D44]">{unreadCount}</span> unread
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {loading ? (
                <div role="status" className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex animate-pulse gap-5 rounded-2xl border-2 border-[#ECE3D3] bg-white p-6"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#EFE9DF]" />
                      <div className="flex-1 space-y-3.5">
                        <div className="h-6 w-1/3 rounded bg-[#EFE9DF]" />
                        <div className="h-5 w-full rounded bg-[#F4EFE6]" />
                        <div className="h-5 w-2/3 rounded bg-[#F4EFE6]" />
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-lg font-bold text-[#5D6953]">
                    Loading notifications...
                  </p>
                </div>
              ) : error ? (
                <div
                  role="alert"
                  className="rounded-2xl border-2 border-[#F3D7CB] bg-[#FAEEE5] p-10 text-center"
                >
                  <p className="text-xl font-bold text-[#B24832]">{error}</p>
                  <button
                    type="button"
                    onClick={refreshNotifications}
                    className="mt-6 min-h-14 rounded-2xl bg-[#C87961] px-8 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#E5DDCE] bg-white p-14 text-center">
                  <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#F6F8F3] text-[#707C65]">
                    <Bell className="h-12 w-12" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-2xl font-black text-stone-800 sm:text-3xl">You&apos;re all caught up</p>
                  <p className="mt-2 text-lg text-stone-500">New notifications will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const announcement = isAnnouncementNotification(notification);
                    const saving = markingReadIds.includes(notification.id);
                    return (
                      <article
                        key={notification.id}
                        id={`notification-${notification.id}`}
                        className={`flex scroll-mt-24 gap-4 rounded-2xl border-2 border-l-[6px] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:gap-6 sm:p-6 ${
                          announcement
                            ? "border-[#E7D8C5] border-l-[#C87961] bg-[#FDF9F2] hover:border-[#C87961]/50"
                            : notification.is_read
                              ? "border-[#ECE3D3] border-l-[#D9D2C3] bg-white hover:border-[#707C65]/40"
                              : "border-[#BCC7B4] border-l-[#5D6953] bg-[#F6F8F3] hover:border-[#707C65]"
                        }`}
                      >
                        {/* Icon tile + unread dot */}
                        <div className="relative shrink-0">
                          <span
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 sm:h-16 sm:w-16 ${
                              announcement
                                ? "bg-[#C87961] text-white"
                                : notification.is_read
                                  ? "bg-[#F1ECE2] text-stone-400"
                                  : "bg-[#5D6953] text-white"
                            }`}
                          >
                            {announcement ? (
                              <Megaphone className="h-7 w-7" aria-hidden="true" />
                            ) : (
                              <Bell className="h-7 w-7" aria-hidden="true" />
                            )}
                          </span>
                          <span
                            className={`absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white ${
                              notification.is_read ? "bg-stone-300" : "bg-[#C85D44]"
                            }`}
                            aria-label={notification.is_read ? "Read" : "Unread"}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <Link
                              href={getNotificationHref(notification)}
                              className="min-w-0 flex-1 rounded-md hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]"
                            >
                              <h3
                                className={`text-xl leading-snug tracking-tight sm:text-2xl ${
                                  announcement
                                    ? "font-black text-[#B24832]"
                                    : notification.is_read
                                      ? "font-bold text-stone-700"
                                      : "font-black text-[#2F3A2A]"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-[#ECE3D3] bg-white/80 px-4 py-3 text-base font-normal leading-7 text-stone-500 sm:text-lg sm:leading-8">
                                {notification.message}
                              </p>
                            </Link>
                            {!notification.is_read && (
                              <button
                                type="button"
                                onClick={() => handleMarkRead(notification.id)}
                                disabled={saving || markingAllRead}
                                aria-label={`Mark ${notification.title} as read`}
                                className={actionBtn}
                              >
                                <Check className="h-5 w-5" />
                                {saving ? "Saving..." : "Mark read"}
                              </button>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <time dateTime={notification.created_at} className="text-base font-medium text-stone-500">
                              {formatDate(notification.created_at)}
                            </time>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-bold capitalize tracking-wide ${
                                announcement
                                  ? "border-[#F4C8B9] bg-[#FEF1EC] text-[#C85D44]"
                                  : notification.is_read
                                    ? "border-[#E8E1D5] bg-[#F7F3EB] text-stone-600"
                                    : "border-[#D9E2D2] bg-white text-[#5D6953]"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  announcement ? "bg-[#C85D44]" : notification.is_read ? "bg-stone-400" : "bg-[#5D6953]"
                                }`}
                                aria-hidden="true"
                              />
                              {announcement
                                ? "Important announcement"
                                : notification.type.replaceAll("_", " ")}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {pagination && pagination.total > 0 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDCE] bg-[#FAF7F0] px-5 py-4 text-base font-medium text-stone-600 sm:px-6 sm:text-lg">
                <span>
                  Showing <strong className="text-stone-800">{notifications.length}</strong> of{" "}
                  <strong className="text-stone-800">{pagination.total}</strong> notifications
                </span>
              </footer>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}