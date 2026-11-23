"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Megaphone, RefreshCw } from "lucide-react";
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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] p-3 font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white sm:p-5 md:p-7 lg:p-9">
      {/* Organic backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
        <svg
          className="h-full w-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z" fill="#848F76" />
          <path d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z" fill="#E3BF96" />
          <path d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z" fill="#C85D44" />
          <path d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z" fill="#D9B288" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1580px] flex-col gap-5 rounded-[36px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] sm:rounded-[42px] sm:p-6 lg:p-8">
        <TopNav active="home" />

        <main className="mx-auto w-full max-w-5xl">
          {/* Page header */}
          <header className="flex flex-col gap-5 border-b border-[#ECE3D3] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] text-white shadow-md">
                <Bell className="h-8 w-8" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#FCFAF7] bg-[#C85D44] px-1.5 text-xs font-black tabular-nums text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
                  INBOX &amp; ALERTS
                </span>
                <h1 className="mt-0.5 text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">
                  Notifications
                </h1>
                <p className="mt-1 text-base font-medium text-stone-600">
                  <span className="font-black text-[#C85D44]">{unreadCount}</span> unread{" "}
                  {unreadCount === 1 ? "notification" : "notifications"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshNotifications}
                disabled={loading}
                className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-5 py-3 text-base font-bold text-[#46513F] shadow-sm transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-5 w-5 text-[#707C65] ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markingAllRead}
                className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl bg-[#C87961] px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="h-5 w-5" />
                {markingAllRead ? "Marking..." : "Mark all as read"}
              </button>
            </div>
          </header>

          {/* Errors */}
          {(actionError || unreadCountError) && (
            <div className="mt-5 space-y-3">
              {actionError && (
                <div role="alert" className="rounded-2xl border border-[#F4C8B9] bg-[#FEF1EC] px-5 py-4 text-base font-semibold text-[#C85D44]">
                  {actionError}
                </div>
              )}
              {unreadCountError && (
                <div role="alert" className="rounded-2xl border border-[#F4C8B9] bg-[#FEF1EC] px-5 py-4 text-base font-semibold text-[#C85D44]">
                  {unreadCountError}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          <section aria-label="Notification list" className="mt-6">
            {loading ? (
              <div role="status" className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse gap-4 rounded-3xl border border-[#ECE3D3] bg-white p-6"
                  >
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#EFE9DF]" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-1/3 rounded bg-[#EFE9DF]" />
                      <div className="h-4 w-full rounded bg-[#F4EFE6]" />
                      <div className="h-4 w-2/3 rounded bg-[#F4EFE6]" />
                    </div>
                  </div>
                ))}
                <p className="text-center text-base font-bold text-[#5D6953]">
                  Loading notifications...
                </p>
              </div>
            ) : error ? (
              <div
                role="alert"
                className="rounded-3xl border border-[#F4C8B9] bg-[#FEF1EC] p-10 text-center"
              >
                <p className="text-lg font-bold text-[#C85D44]">{error}</p>
                <button
                  type="button"
                  onClick={refreshNotifications}
                  className="mt-5 min-h-12 rounded-2xl bg-[#C87961] px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5DDCE] bg-white p-14 text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F6F8F3] text-[#707C65]">
                  <Bell className="h-10 w-10" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xl font-black text-stone-800">You&apos;re all caught up</p>
                <p className="mt-1.5 text-base text-stone-500">New notifications will appear here.</p>
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
                      className={`scroll-mt-24 flex gap-4 rounded-3xl border-2 p-5 shadow-sm transition hover:shadow-md sm:gap-5 sm:p-6 ${
                        announcement
                          ? "border-[#EDD7BE] bg-[#FDF8F0] hover:border-[#E3BF96]"
                          : notification.is_read
                            ? "border-[#ECE3D3] bg-white hover:border-[#D9E2D2]"
                            : "border-[#BCC7B4] bg-[#F6F8F3] hover:border-[#707C65]"
                      }`}
                    >
                      {/* Icon tile + unread dot */}
                      <div className="relative shrink-0">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${
                            announcement
                              ? "bg-[#F6E4C8] text-[#9B6A38]"
                              : notification.is_read
                                ? "bg-[#F1ECE2] text-stone-400"
                                : "bg-[#5D6953] text-white"
                          }`}
                        >
                          {announcement ? (
                            <Megaphone className="h-6 w-6" aria-hidden="true" />
                          ) : (
                            <Bell className="h-6 w-6" aria-hidden="true" />
                          )}
                        </span>
                        <span
                          className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
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
                            <h2
                              className={`text-lg leading-snug text-stone-900 sm:text-xl ${
                                notification.is_read ? "font-bold" : "font-black"
                              }`}
                            >
                              {notification.title}
                            </h2>
                            <p className="mt-1.5 whitespace-pre-wrap text-base leading-7 text-stone-600">
                              {notification.message}
                            </p>
                          </Link>
                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(notification.id)}
                              disabled={saving || markingAllRead}
                              aria-label={`Mark ${notification.title} as read`}
                              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#D9E2D2] bg-white px-4 py-2 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check className="h-4 w-4 text-[#5D6953]" />
                              {saving ? "Saving..." : "Mark read"}
                            </button>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                          <time dateTime={notification.created_at} className="font-medium text-stone-500">
                            {formatDate(notification.created_at)}
                          </time>
                          <span
                            className={`rounded-full border px-3 py-1 text-[13px] font-bold capitalize ${
                              announcement
                                ? "border-[#EDD7BE] bg-[#FBEBD0] text-[#815526]"
                                : "border-[#E5DDCE] bg-[#F7F3EB] text-stone-600"
                            }`}
                          >
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

            {pagination && pagination.total > 0 && (
              <footer className="mt-6 rounded-2xl border border-[#ECE3D3] bg-[#FAF7F0] px-5 py-4 text-center text-base font-medium text-stone-600">
                Showing <strong className="text-stone-800">{notifications.length}</strong> of{" "}
                <strong className="text-stone-800">{pagination.total}</strong> notifications
              </footer>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}